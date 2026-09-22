import { Sequelize } from '@sequelize/core';
import { Usuario } from '../models/usuario.model';
import { Post } from '../models/post.model';
import { Tema } from '../models/tema.model';
import { UsuarioTema } from '../models/usuarioTemas.model';
import { Role } from '../models/role.model';
import { logger } from '../utils/logger';

interface DbConfig {
    host: string
    port: number
    database: string
    username: string
    password: string
}

/** Configuración clásica por partes (variables DB_*). */
const configPorPartes: DbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    database: process.env.DB_NAME || 'prueba_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
}

/**
 * Parsea una URL de conexión tipo mysql://usuario:clave@host:puerto/base
 * (la entregan Aiven, Railway, Clever Cloud, etc.). Se ignoran los parámetros
 * de la query (p. ej. ?ssl-mode=REQUIRED): el TLS se controla con DB_SSL_*.
 */
function configDesdeUrl(raw: string): DbConfig {
    const url = new URL(raw)
    const scheme = (url.protocol || '').toLowerCase()
    if (scheme !== 'mysql:' && scheme !== 'mariadb:') {
        throw new Error(`DATABASE_URL con protocolo "${url.protocol}" no soportado; usa "mysql://..."`)
    }
    return {
        host: url.hostname,
        port: toInt(url.port, 3306),
        database: decodeURIComponent((url.pathname || '').replace(/^\/+/, '')) || 'prueba_db',
        username: decodeURIComponent(url.username || ''),
        password: decodeURIComponent(url.password || ''),
    }
}

const config: DbConfig = process.env.DATABASE_URL
    ? configDesdeUrl(process.env.DATABASE_URL)
    : configPorPartes

/**
 * Opciones TLS para mysql2 (Sequelize las reenvía tal cual vía dialectOptions).
 * - Sin configuración: TLS cifrado sin verificar la CA (conecta a Aiven, que
 *   exige `ssl-mode=REQUIRED`, sin ficheros; NO usar así con datos críticos).
 * - Con DB_SSL_CA_PATH (ruta al .pem) o DB_SSL_CA (contenido PEM): verificación
 *   de certificado completa (recomendado en producción).
 * - Con DB_SSL=false o DB_SSL=disable: sin cifrado (solo redes privadas fiables).
 */
function opcionesSsl(): Record<string, unknown> | undefined {
    const sinSsl = process.env.DB_SSL === 'false' || process.env.DB_SSL === 'disable'
    if (sinSsl) return undefined

    const rutaCa = process.env.DB_SSL_CA_PATH || process.env.DB_SSL_CA_FILE
    const contenidoCa = process.env.DB_SSL_CA

    if (!rutaCa && !contenidoCa) {
        return { rejectUnauthorized: false }
    }

    return {
        ca: rutaCa || contenidoCa,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    }
}

const sslOptions = opcionesSsl()

const db = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: 'mysql',
        models: [Usuario, Post, Tema, UsuarioTema, Role],
        dialectOptions: sslOptions ? { ssl: sslOptions } : undefined,
        // Pool de conexiones: el número máximo de conexiones está acotado por
        // worker. Si usas cluster (WEB_CONCURRENCY > 1), el total de conexiones
        // abiertas en la BD será aproximadamente workers * max.
        pool: {
            max: toInt(process.env.DB_POOL_MAX, 10),
            min: toInt(process.env.DB_POOL_MIN, 0),
            idle: toInt(process.env.DB_POOL_IDLE_MS, 10_000),
            acquire: toInt(process.env.DB_POOL_ACQUIRE_MS, 30_000),
            evict: toInt(process.env.DB_POOL_EVICT_MS, 60_000),
        },
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    }
)

const CONTEXT = 'DbConnection'

/** Devuelve la configuración de BD resuelta (SANITIZADA: sin password) para logs/errores. */
export function getDbInfo() {
    return {
        viaUrl: Boolean(process.env.DATABASE_URL),
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        ssl: sslOptions ? JSON.stringify(sslOptions) : 'off',
    }
}

// Al arrancar se muestra a qué BD intenta conectarse realmente. Clave para
// depurar desplegues (p. ej. Render) cuando DB_HOST/DATABASE_URL no llegaron.
logger.info(CONTEXT, 'Configuración de BD resuelta', getDbInfo())

/** Convierte una variable de entorno a entero; si no es válida usa el default. */
function toInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10)
    return Number.isNaN(parsed) ? fallback : parsed
}

async function inicializarBaseDatos() {
  try {
    // 1. Sincronizar los modelos con la base de datos
    await db.sync({ alter: true });
    console.log('--- Base de datos sincronizada ---');

    // 2. Crear los Roles por defecto si no existen
    // findOrCreate devuelve un arreglo: [instancia, creada_ahora_si_o_no]
    const [adminRol, adminCreado] = await Role.findOrCreate({
      where: { nombre: 'ADMIN' },
      defaults: {
        nombre: 'ADMIN',
        descripcion: 'Administrador total del sistema'
      }
    });

    const [userRol, userCreado] = await Role.findOrCreate({
      where: { nombre: 'USER' },
      defaults: {
        nombre: 'USER',
        descripcion: 'Usuario estándar de la aplicación'
      }
    });

    if (adminCreado) console.log('Rol ADMIN creado por primera vez.');
    if (userCreado) console.log('Rol USER creado por primera vez.');

    // 3. Crear un Usuario Administrador inicial si no existe ninguno
    const [adminUser, userAdminCreado] = await Usuario.findOrCreate({
      where: { email: 'claudio@gmail.com' },
      defaults: {
        name: 'Administrador Inicial',
        email: 'claudio@gmail.com',
        password: '6f0a4d34a7a67ea901216358af570110$d88d2c39674fc83ff90cc3f03d591aa2f164d99aeb00e0d9af7bec87c531a79ff40750b1d535ceb4ca545290cb3bd5fcc8d5d028813b4ab1d73cb8287e6aa963', // Recuerda encriptar esto en producción
        isActive: true,
        roleId: adminRol.id // Le asignamos el ID del rol obtenido o creado arriba
      }
    });

    console.log('--- Inicialización en tiempo de ejecución completada con éxito ---');

  } catch (error) {
    console.error('Error durante la inicialización de la base de datos:', error);
  }
}

inicializarBaseDatos();

export default db