/**
 * Estrategia de concurrencia para el servidor HTTP.
 *
 * Node.js ejecuta JavaScript en un único hilo (event loop). Para manejar un
 * mayor volumen de peticiones concurrentes y aprovechar todos los núcleos de
 * la CPU, este módulo implementa:
 *
 *  - **Cluster (multi-proceso)**: el proceso "primario" reparte el tráfico
 *    entre N "workers" (procesos hijos) usando el balanceo de carga que trae
 *    Node.js por defecto. Cada worker atiende peticiones de forma concurrente
 *    (I/O asíncrono) sobre su propio event loop.
 *  - **Reinicio automático**: si un worker muere por una excepción, el primario
 *    lo vuelve a crear.
 *  - **Graceful shutdown**: ante SIGINT/SIGTERM se deja de aceptar conexiones,
 *    se esperan las peticiones en vuelo y se cierra el pool de la base de
 *    datos antes de salir.
 *
 * Configuración (variables de entorno):
 *  - `WEB_CONCURRENCY`: número de workers (≥ 1). Por defecto usa
 *    `os.availableParallelism()` en producción y `1` en desarrollo/test.
 *  - `SHUTDOWN_TIMEOUT_MS`: tiempo máximo de apagado elegante antes de forzar
 *    la salida (por defecto 30 000 ms).
 */

import cluster from 'cluster'
import http from 'http'
import os from 'os'

import Server from './server'
import db from './db/connection'

const SHUTDOWN_TIMEOUT_MS = Number.parseInt(process.env.SHUTDOWN_TIMEOUT_MS ?? '', 10) || 30_000

/** Número de workers deseado (respeta el límite de CPUs disponibles). */
export function getWorkerCount(): number {
  // En test no tiene sentido forkar procesos hijos.
  if (process.env.NODE_ENV === 'test') return 1

  const fromEnv = Number.parseInt(process.env.WEB_CONCURRENCY ?? '', 10)
  if (Number.isInteger(fromEnv) && fromEnv >= 1) return fromEnv

  if (process.env.NODE_ENV === 'production') return getCpuCount()
  return 1
}

function getCpuCount(): number {
  try {
    if (typeof os.availableParallelism === 'function') return Math.max(1, os.availableParallelism())
  } catch {
    /* versión de Node sin availableParallelism */
  }
  return Math.max(1, os.cpus().length)
}

function isPrimary(): boolean {
  return cluster.isPrimary
}

/**
 * Punto de entrada del proceso. Decide si actuar como primario del cluster
 * (forkeando workers) o arrancar un servidor directamente.
 */
export async function start(): Promise<void> {
  installGlobalErrorHandlers()

  const workerCount = getWorkerCount()

  // Un único worker: servidor en este proceso (ideal para dev/test).
  if (isPrimary() && workerCount <= 1) {
    await bootWorker()
    return
  }

  // Proceso primario del cluster: gestiona y supervisa a los workers.
  if (isPrimary()) {
    startCluster(workerCount)
    return
  }

  // Proceso worker: arranca el servidor real.
  await bootWorker()
}

/**
 * Manejo de errores a nivel de proceso. Tras un `uncaughtException` el estado
 * del proceso es indeterminado: lo correcto es registrar y salir para que el
 * cluster (o el orquestador) reinicie el worker.
 */
function installGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('[process] Excepción no capturada, el proceso se cerrará:', error)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[process] Promesa rechazada sin manejar, el proceso se cerrará:', reason)
    process.exit(1)
  })
}

/** Apagado elegante: cierra el HTTP server y luego el pool de Sequelize. */
function registerGracefulShutdown(httpServer: http.Server): void {
  let shuttingDown = false

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return
    shuttingDown = true
    console.info(`[server] Recibida la señal ${signal}. Iniciando apagado elegante...`)

    // Si algo se cuelga, no bloquear el reinicio indefinidamente.
    const forceExit = setTimeout(() => {
      console.error(`[server] Apagado forzado tras ${SHUTDOWN_TIMEOUT_MS} ms.`)
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExit.unref()

    // Deja de aceptar conexiones nuevas y espera a las peticiones en curso.
    httpServer.close(async (closeErr) => {
      try {
        await db.close()
        console.info('[db] Pool de conexiones cerrado correctamente.')
      } catch (dbError) {
        console.error('[db] Error cerrando el pool de conexiones:', dbError)
      }
      clearTimeout(forceExit)
      process.exit(closeErr ? 1 : 0)
    })

    // Corta las conexiones keep-alive inactivas para no bloquear el cierre.
    setTimeout(() => httpServer.closeIdleConnections(), 2_000).unref()
  }

  process.on('SIGINT', shutdown) // Ctrl+C
  process.on('SIGTERM', shutdown) // kill / orquestadores
}

/** Modo primario: forkea workers, los reinicia y propaga señales de cierre. */
function startCluster(workerCount: number): void {
  console.info(`[cluster] Primario #${process.pid} forkeando ${workerCount} worker(s)...`)

  for (let i = 0; i < workerCount; i++) {
    cluster.fork()
  }

  let shuttingDown = false
  const restartTimes: number[] = []
  const MAX_RESTARTS = 5
  const RESTART_WINDOW_MS = 5_000

  // Si los workers mueren demasiado rápido (p. ej. BD caída), salir en lugar de
  // hacer "crash loop" reiniciándolos sin fin.
  const tooManyRestarts = (): boolean => {
    const now = Date.now()
    while (restartTimes.length > 0 && now - restartTimes[0] > RESTART_WINDOW_MS) {
      restartTimes.shift()
    }
    restartTimes.push(now)
    return restartTimes.length > MAX_RESTARTS
  }

  cluster.on('exit', (worker, code, signal) => {
    if (shuttingDown) {
      const remaining = Object.keys(cluster.workers ?? {}).length
      if (remaining === 0) {
        console.info('[cluster] Todos los workers finalizaron. Saliendo del proceso primario.')
        process.exit(0)
      }
      return
    }

    if (tooManyRestarts()) {
      console.error(
        '[cluster] Demasiados reinicios en poco tiempo. Saliendo para evitar un crash loop.'
      )
      process.exit(1)
    }

    console.warn(
      `[cluster] Worker ${worker.process.pid} terminó (code=${code}, signal=${signal}). Reiniciando...`
    )
    cluster.fork()
  })

  // Propagar señales de terminación a los workers para un apagado coordinado.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      shuttingDown = true
      console.info(`[cluster] ${signal} recibido en el primario; propagando a los workers...`)

      for (const worker of Object.values(cluster.workers ?? {})) {
        if (!worker) continue
        worker.process?.kill(signal)
      }

      setTimeout(() => {
        console.info('[cluster] Timeout de apagado agotado; salida forzada del primario.')
        process.exit(0)
      }, SHUTDOWN_TIMEOUT_MS).unref()
    })
  }
}

/** Crea el Server, espera a que la BD esté lista y queda escuchando. */
async function bootWorker(): Promise<void> {
  const server = new Server()
  const httpServer = await server.start()

  registerGracefulShutdown(httpServer)
  console.info(`[server] Worker #${process.pid} listo en el puerto ${server.getPort()}`)
}