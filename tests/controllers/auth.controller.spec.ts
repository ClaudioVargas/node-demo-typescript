import { signup, login, logout, hashPasswordTest } from '../../src/controllers/auth.controller'
import {
  signup as repoSignup,
  login as repoLogin,
  logout as repoLogout,
  hashPassword as repoHash,
} from '../../src/repository/auth.repository'
import { ApiError } from '../../src/validators/apiError'

jest.mock('../../src/repository/auth.repository', () => ({
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  hashPassword: jest.fn(),
}))

describe('auth.controller', () => {
  function makeRes(): any {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() }
  }
  function makeReq(overrides: any = {}): any {
    return Object.assign({ body: {}, params: {}, headers: {} }, overrides)
  }

  describe('signup', () => {
    test('400 si falta name, email o password', async () => {
      const next = jest.fn()
      await signup(makeReq(), {} as any, next)

      const err = next.mock.calls[0][0]
      expect(err).toBeInstanceOf(ApiError)
      expect(err.status).toBe(400)
      expect(err.message).toBe('name, email and password required')
    })

    test('409 si el email ya está registrado', async () => {
      ;(repoSignup as jest.Mock).mockResolvedValue(null)
      const next = jest.fn()
      await signup(makeReq({ body: { name: 'Ana', email: 'a@b.co', password: 'x' } }), {} as any, next)

      expect(next.mock.calls[0][0].status).toBe(409)
    })

    test('201 con id, name y email al crear correctamente', async () => {
      ;(repoSignup as jest.Mock).mockResolvedValue({ id: 1, name: 'Ana', email: 'a@b.co' })
      const res = makeRes()
      const next = jest.fn()

      await signup(makeReq({ body: { name: 'Ana', email: 'a@b.co', password: 'x' } }), res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Ana', email: 'a@b.co' })
      expect(next).not.toHaveBeenCalled()
    })

    test('propaga el error del repositorio a next', async () => {
      const error = new Error('db down')
      ;(repoSignup as jest.Mock).mockRejectedValue(error)
      const next = jest.fn()

      await signup(makeReq({ body: { name: 'Ana', email: 'a@b.co', password: 'x' } }), {} as any, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('login', () => {
    test('400 si falta email o password', async () => {
      const next = jest.fn()
      await login(makeReq(), {} as any, next)

      expect(next.mock.calls[0][0].status).toBe(400)
    })

    test('401 si las credenciales son inválidas', async () => {
      ;(repoLogin as jest.Mock).mockResolvedValue(null)
      const next = jest.fn()

      await login(makeReq({ body: { email: 'a@b.co', password: 'mala' } }), {} as any, next)

      expect(next.mock.calls[0][0].status).toBe(401)
      expect(next.mock.calls[0][0].message).toBe('Invalid credentials')
    })

    test('200 con el token si las credenciales son válidas', async () => {
      ;(repoLogin as jest.Mock).mockResolvedValue('token-abc')
      const res = makeRes()
      const next = jest.fn()

      await login(makeReq({ body: { email: 'a@b.co', password: 'buena' } }), res, next)

      expect(res.json).toHaveBeenCalledWith({ token: 'token-abc' })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    test('400 si no hay cabecera Bearer', async () => {
      const next = jest.fn()
      await logout(makeReq(), {} as any, next)

      expect(next.mock.calls[0][0].status).toBe(400)
    })

    test('200 y agrega el token a la blacklist', async () => {
      const res = makeRes()
      const next = jest.fn()

      await logout(makeReq({ headers: { authorization: 'Bearer token-xyz' } }), res, next)

      expect(repoLogout).toHaveBeenCalledWith('token-xyz')
      expect(res.json).toHaveBeenCalledWith({ ok: true })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('hashPasswordTest', () => {
    test('400 sin password en los params', async () => {
      const next = jest.fn()
      await hashPasswordTest(makeReq(), {} as any, next)

      expect(next.mock.calls[0][0].status).toBe(400)
    })

    test('200 con el hash cuando el password viene', async () => {
      ;(repoHash as jest.Mock).mockResolvedValue('hash-generado')
      const res = makeRes()
      const next = jest.fn()

      await hashPasswordTest(makeReq({ params: { password: 'mi-clave' } }), res, next)

      expect(res.json).toHaveBeenCalledWith({ ok: true, hash: 'hash-generado' })
    })
  })
})