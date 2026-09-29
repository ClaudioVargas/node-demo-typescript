import express from 'express'
import passport from 'passport'
import Server from '../src/server'
import db from '../src/db/connection'

// Mismos mocks que tests/index.spec.ts para aislar la clase Server.
jest.mock('express', () => {
  const mApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn((port: any, cb: any) => cb && cb()),
  }
  const mExpress = jest.fn(() => mApp)
  ;(mExpress as any).json = jest.fn(() => 'json-middleware')
  ;(mExpress as any).static = jest.fn(() => 'static-middleware')
  ;(mExpress as any).Router = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }))
  return mExpress
})

jest.mock('passport', () => ({
  use: jest.fn(),
  initialize: jest.fn(() => 'passport-init'),
  session: jest.fn(() => 'passport-session'),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn(() => (req: any, res: any, next: any) => next()),
}))

jest.mock('../src/db/connection', () => ({
  authenticate: jest.fn(() => Promise.resolve()),
  sync: jest.fn(() => Promise.resolve()),
  models: {
    Tema: { sync: jest.fn(() => Promise.resolve()) },
    Usuario: { sync: jest.fn(() => Promise.resolve()) },
    Post: { sync: jest.fn(() => Promise.resolve()) },
  },
}))

jest.mock('cors', () => jest.fn(() => 'cors-middleware'))
jest.mock('express-session', () => jest.fn(() => 'session-middleware'))
jest.mock('../src/routes/auth.router', () => 'auth-router')
jest.mock('../src/routes/role.router', () => 'role-router')
jest.mock('../src/routes/stream.router', () => 'stream-router')
jest.mock('../src/routes/usuario.router', () => 'usuario-router')
jest.mock('../src/routes/post.router', () => 'post-router')
jest.mock('../src/routes/tema.router', () => 'tema-router')

describe('Clase Server (pruebas adicionales)', () => {
  let server: Server
  let mockApp: any
  const prevPort = process.env.PORT

  beforeEach(() => {
    jest.clearAllMocks()
    mockApp = express()
    server = new Server()
  })

  afterAll(() => {
    if (prevPort === undefined) delete process.env.PORT
    else process.env.PORT = prevPort
  })

  describe('getPort', () => {
    test('usa 8000 como puerto por defecto', () => {
      delete process.env.PORT
      try {
        expect(new Server().getPort()).toBe('8000')
      } finally {
        if (prevPort === undefined) delete process.env.PORT
        else process.env.PORT = prevPort
      }
    })

    test('respeta process.env.PORT', () => {
      process.env.PORT = '4321'
      try {
        expect(new Server().getPort()).toBe('4321')
      } finally {
        if (prevPort === undefined) delete process.env.PORT
        else process.env.PORT = prevPort
      }
    })
  })

  describe('ensureDbConnected', () => {
    test('resuelve cuando la BD autentica correctamente', async () => {
      await expect(server.ensureDbConnected()).resolves.toBeUndefined()
    })

    test('lanza el error guardado si la autenticación falló en el constructor', async () => {
      ;(db.authenticate as jest.Mock).mockRejectedValueOnce(new Error('conexión rechazada'))
      const failing = new Server()
      await new Promise((r) => setTimeout(r, 10))
      await expect(failing.ensureDbConnected()).rejects.toThrow(/conexión rechazada/)
    })
  })

  describe('rutas OAuth', () => {
    test('registra las rutas de Google y protege /protected con isLoggerIn', () => {
      expect(mockApp.get).toHaveBeenCalledWith('/auth/google', expect.any(Function))
      expect(mockApp.get).toHaveBeenCalledWith('/auth/google/callback', expect.any(Function))
      expect(mockApp.get).toHaveBeenCalledWith('/auth/failure', expect.any(Function))
      expect(passport.authenticate).toHaveBeenCalledWith(
        'google',
        expect.objectContaining({ scope: ['email', 'profile'] })
      )
      // /protected usa el middleware isLoggerIn + handler: recibe 3 argumentos
      expect(mockApp.get).toHaveBeenCalledWith(
        '/protected',
        expect.any(Function),
        expect.any(Function)
      )
    })
  })

  describe('dbConnection', () => {
    test('propaga el error de db.authenticate al guardado del constructor', async () => {
      ;(db.authenticate as jest.Mock).mockRejectedValueOnce(new Error('auth falló'))
      const s = new Server()
      await new Promise((r) => setTimeout(r, 10))
      await expect(s.ensureDbConnected()).rejects.toThrow(/auth falló/)
    })
  })
})