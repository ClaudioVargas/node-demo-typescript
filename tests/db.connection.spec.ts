jest.mock('@sequelize/core', () => ({
  Sequelize: jest.fn().mockImplementation(() => ({
    sync: jest.fn(async () => 0),
    close: jest.fn(async () => 0),
  })),
}))

jest.mock('../src/models/usuario.model', () => ({
  Usuario: { findOrCreate: jest.fn(async () => [{ id: 1 }, false]) },
}))
jest.mock('../src/models/post.model', () => ({ Post: {} }))
jest.mock('../src/models/tema.model', () => ({ Tema: {} }))
jest.mock('../src/models/usuarioTemas.model', () => ({ UsuarioTema: {} }))
jest.mock('../src/models/role.model', () => ({
  Role: { findOrCreate: jest.fn(async () => [{ id: 1 }, false]) },
}))

describe('db/connection', () => {
  const ENV_KEYS = [
    'DATABASE_URL',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_SSL',
    'DB_SSL_CA_PATH',
    'DB_SSL_CA_FILE',
    'DB_SSL_CA',
    'DB_SSL_REJECT_UNAUTHORIZED',
  ]
  const backup: Record<string, string | undefined> = {}
  let getDbInfo: () => {
    viaUrl: boolean
    host: string
    port: number
    database: string
    user: string
    ssl: string
  }

  beforeAll(() => {
    for (const k of ENV_KEYS) {
      backup[k] = process.env[k]
      delete process.env[k]
    }
  })
  beforeEach(() => {
    jest.resetModules()
    for (const k of ENV_KEYS) delete process.env[k]
  })
  afterAll(() => {
    for (const k of ENV_KEYS) {
      const v = backup[k]
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  test('usa valores por defecto sin variables de entorno', () => {
    getDbInfo = require('../src/db/connection').getDbInfo
    expect(getDbInfo()).toEqual({
      viaUrl: false,
      host: 'localhost',
      port: 3306,
      database: 'prueba_db',
      user: 'root',
      ssl: '{"rejectUnauthorized":false}',
    })
  })

  test('sin CA configurada el TLS conecta sin verificar el certificado', () => {
    getDbInfo = require('../src/db/connection').getDbInfo
    expect(getDbInfo().ssl).toBe('{"rejectUnauthorized":false}')
  })

  test('DB_SSL=false desactiva el TLS ("off")', () => {
    process.env.DB_SSL = 'false'
    getDbInfo = require('../src/db/connection').getDbInfo
    expect(getDbInfo().ssl).toBe('off')
  })

  test('una URL de conexión inválida cae al puerto por defecto', () => {
    process.env.DB_PORT = 'abc'
    getDbInfo = require('../src/db/connection').getDbInfo
    expect(getDbInfo().port).toBe(3306)
  })

  test('DATABASE_URL mysql:// se parsea y se reporta como viaUrl', () => {
    process.env.DATABASE_URL = 'mysql://usuario:p%40ss@db.internal:3307/mi_base'
    getDbInfo = require('../src/db/connection').getDbInfo
    const info = getDbInfo()
    expect(info.viaUrl).toBe(true)
    expect(info.host).toBe('db.internal')
    expect(info.port).toBe(3307)
    expect(info.database).toBe('mi_base')
    expect(info.user).toBe('usuario')
  })

  test('DATABASE_URL con protocolo no soportado lanza error al cargar', () => {
    process.env.DATABASE_URL = 'postgres://u:p@h:5432/db'
    expect(() => require('../src/db/connection')).toThrow(/no soportado/)
  })

  test('DB_SSL_CA_PATH habilita la verificación de certificado', () => {
    process.env.DB_SSL_CA_PATH = '/certs/ca.pem'
    getDbInfo = require('../src/db/connection').getDbInfo
    const ssl = JSON.parse(getDbInfo().ssl)
    expect(ssl.ca).toBe('/certs/ca.pem')
    expect(ssl.rejectUnauthorized).toBe(true)
  })
})