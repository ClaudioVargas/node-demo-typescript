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
  if (process.env.NODE_ENV === 'test') {
    console.info('[cluster] NODE_ENV=test → 1 worker (los tests corren en un solo proceso).')
    return 1
  }

  const fromEnv = Number.parseInt(process.env.WEB_CONCURRENCY ?? '', 10)
  if (Number.isInteger(fromEnv) && fromEnv >= 1) {
    // La variable de entorno permite forzar el nº de workers de forma manual.
    console.info(`[cluster] WEB_CONCURRENCY=${fromEnv} → se forzarán ${fromEnv} worker(s).`)
    return fromEnv
  }

  if (process.env.NODE_ENV === 'production') {
    const count = getCpuCount()
    // En producción, un worker por núcleo es el punto de partida habitual.
    console.info(`[cluster] NODE_ENV=production → ${count} worker(s) (uno por núcleo de CPU).`)
    return count
  }

  console.info('[cluster] Desarrollo sin WEB_CONCURRENCY → 1 worker (más fácil de depurar).')
  return 1
}

function getCpuCount(): number {
  try {
    if (typeof os.availableParallelism === 'function') {
      const count = Math.max(1, os.availableParallelism())
      // API moderna de Node: nº de hilos que la CPU puede ejecutar en paralelo.
      console.info(`[cluster] Núcleos detectados con os.availableParallelism(): ${count}`)
      return count
    }
  } catch {
    /* versión de Node sin availableParallelism */
  }
  const count = Math.max(1, os.cpus().length)
  // Fallback para versiones antiguas de Node: lista de CPUs del sistema.
  console.info(`[cluster] Núcleos detectados con os.cpus(): ${count}`)
  return count
}

function isPrimary(): boolean {
  return cluster.isPrimary
}

/**
 * Punto de entrada del proceso. Decide si actuar como primario del cluster
 * (forkeando workers) o arrancar un servidor directamente.
 */
export async function start(): Promise<void> {
  // Punto de entrada: se ejecuta UNA vez por cada proceso (primario y cada worker).
  console.info(`[cluster] Proceso #${process.pid} entra en start()...`)
  console.info(`[cluster] ¿Este proceso es el primario del cluster? ${isPrimary()}`)

  // Registrar los manejadores de errores globales antes de hacer nada más.
  installGlobalErrorHandlers()

  const workerCount = getWorkerCount()

  // Un único worker: servidor en este proceso (ideal para dev/test).
  if (isPrimary() && workerCount <= 1) {
    console.info('[cluster] Modo "single": este proceso será el único servidor, sin hijos.')
    await bootWorker()
    return
  }

  // Proceso primario del cluster: gestiona y supervisa a los workers.
  if (isPrimary()) {
    console.info(`[cluster] Primario #${process.pid}: supervisará ${workerCount} worker(s).`)
    startCluster(workerCount)
    return
  }

  // Llegamos aquí SOLO si este proceso es un worker hijo (cluster.isPrimary=false).
  console.info(`[cluster] Worker hijo #${process.pid}: arrancando servidor independiente...`)
  await bootWorker()
}

/**
 * Manejo de errores a nivel de proceso. Tras un `uncaughtException` el estado
 * del proceso es indeterminado: lo correcto es registrar y salir para que el
 * cluster (o el orquestador) reinicie el worker.
 */
function installGlobalErrorHandlers(): void {
  // Excepción síncrona no capturada: el estado del proceso es indeterminado, así
  // que registramos el error y salimos para que el cluster lo reinicie limpio.
  process.on('uncaughtException', (error: Error) => {
    console.error('[process] Excepción no capturada, el proceso se cerrará:', error)
    process.exit(1)
  })

  // Promesa rechazada sin .catch(): misma política de "fallar rápido" y reiniciar.
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[process] Promesa rechazada sin manejar, el proceso se cerrará:', reason)
    process.exit(1)
  })
}

/** Apagado elegante: cierra el HTTP server y luego el pool de Sequelize. */
function registerGracefulShutdown(httpServer: http.Server): void {
  let shuttingDown = false

  const shutdown = (signal: NodeJS.Signals): void => {
    // Evita ejecutar la secuencia dos veces si llegan señales repetidas.
    if (shuttingDown) return
    shuttingDown = true
    // Se recibió Ctrl+C (SIGINT) o kill (SIGTERM): comienza el cierre ordenado.
    console.info(`[server] Recibida la señal ${signal}. Iniciando apagado elegante...`)

    // Si algo se cuelga, no bloquear el reinicio indefinidamente.
    const forceExit = setTimeout(() => {
      console.error(`[server] Apagado forzado tras ${SHUTDOWN_TIMEOUT_MS} ms.`)
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExit.unref()

    // Deja de aceptar conexiones nuevas y espera a las peticiones en curso.
    // El callback se ejecuta cuando todas las conexiones activas han terminado.
    httpServer.close(async (closeErr) => {
      console.info(`[server] HTTP server cerrado (closeErr=${closeErr ?? 'ninguno'}). Cerrando pool de BD...`)
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
    setTimeout(() => {
      console.info('[server] Desconectando conexiones keep-alive inactivas (tras 2s)...')
      httpServer.closeIdleConnections()
    }, 2_000).unref()
  }

  process.on('SIGINT', shutdown) // Ctrl+C
  process.on('SIGTERM', shutdown) // kill / orquestadores
}

/** Modo primario: forkea workers, los reinicia y propaga señales de cierre. */
function startCluster(workerCount: number): void {
  // Este código SOLO se ejecuta en el proceso PRIMARIO (nunca en los workers).
  console.info(`[cluster] Primario #${process.pid} forkeando ${workerCount} worker(s)...`)

  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork()
    // cluster.fork() crea un proceso hijo que ejecuta el MISMO archivo de entrada (app.ts).
    console.info(`[cluster] Worker lanzado #${worker.process.pid} (fork ${i + 1}/${workerCount})`)
  }

  // 'online' se emite cuando el proceso del worker ya está vivo (antes de escuchar).
  cluster.on('online', (worker) => {
    console.info(`[cluster] Worker #${worker.process.pid} está ONLINE (proceso vivo).`)
  })

  // 'listening' se emite cuando el worker empieza a escuchar en el puerto.
  // En cluster el worker comparte el socket con el primario → address.address suele ser vacío.
  cluster.on('listening', (worker, address) => {
    const addr = typeof address === 'string'
      ? address
      : address && address.address
        ? `${address.address}:${address.port}`
        : `puerto ${address.port} (socket compartido con el primario)`
    console.info(`[cluster] Worker #${worker.process.pid} ESCUCHANDO en ${addr}`)
  })

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
      // Durante el apagado NO se reinicia: solo esperamos a que todos terminen.
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

    // El worker murió de forma inesperada: el primario crea otro para mantener
    // la capacidad del servicio (alta disponibilidad básica).
    console.warn(
      `[cluster] Worker ${worker.process.pid} terminó (code=${code}, signal=${signal}). Reiniciando...`
    )
    cluster.fork()
  })

  // Propagar señales de terminación a los workers para un apagado coordinado.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      shuttingDown = true
      // El primario también recibe SIGINT/SIGTERM y debe reenviarlos a los
      // workers para que hagan su cierre elegante de forma coordinada.
      console.info(`[cluster] ${signal} recibido en el primario; propagando a los workers...`)

      for (const worker of Object.values(cluster.workers ?? {})) {
        if (!worker) continue
        worker.process?.kill(signal)
      }

      // Red de seguridad: si algún worker no termina, el primario sale igualmente.
      setTimeout(() => {
        console.info('[cluster] Timeout de apagado agotado; salida forzada del primario.')
        process.exit(0)
      }, SHUTDOWN_TIMEOUT_MS).unref()
    })
  }
}

/** Crea el Server, espera a que la BD esté lista y queda escuchando. */
async function bootWorker(): Promise<void> {
  // Cada worker construye su propia instancia del Server (con SU propio pool de BD).
  console.info(`[server] Worker #${process.pid} creando Server y conectando a la BD...`)
  const server = new Server()
  // server.start() espera a que la BD responda ANTES de empezar a escuchar.
  const httpServer = await server.start()

  // Registrar el apagado elegante (SIGINT/SIGTERM) para este worker.
  registerGracefulShutdown(httpServer)
  console.info(`[server] Worker #${process.pid} listo en el puerto ${server.getPort()}`)
  // A partir de aquí el worker atiende peticiones con su propio event loop.
  console.info(`[server] Worker #${process.pid} escuchando peticiones (event loop propio).`)
}