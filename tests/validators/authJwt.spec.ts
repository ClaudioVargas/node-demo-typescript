import { authJwt } from '../../src/validators/authJwt'
import { ApiError } from '../../src/validators/apiError'
import jwt from 'jsonwebtoken'
import { isTokenBlacklisted } from '../../src/validators/tokenBlacklist'

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
  decode: jest.fn(),
}))

jest.mock('../../src/validators/tokenBlacklist', () => ({
  isTokenBlacklisted: jest.fn(() => false),
}))

describe('authJwt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(isTokenBlacklisted as jest.Mock).mockReturnValue(false)
  })

  function makeReq(header?: string): any {
    return { headers: { authorization: header } }
  }

  test('sin cabecera Authorization → ApiError 401 "No token provided"', () => {
    const next = jest.fn()
    authJwt(makeReq(), {} as any, next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(401)
    expect(err.message).toBe('No token provided')
  })

  test('cabecera que no arranca con "Bearer " → ApiError 401', () => {
    const next = jest.fn()
    authJwt(makeReq('Basic abc123'), {} as any, next)

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError)
    expect(next.mock.calls[0][0].status).toBe(401)
  })

  test('token en blacklist → ApiError 401 "Token revoked" sin verificar el JWT', () => {
    ;(isTokenBlacklisted as jest.Mock).mockReturnValue(true)
    const next = jest.fn()
    authJwt(makeReq('Bearer token-baneado'), {} as any, next)

    const err = next.mock.calls[0][0]
    expect(err.status).toBe(401)
    expect(err.message).toBe('Token revoked')
    expect(jwt.verify).not.toHaveBeenCalled()
  })

  test('token válido → asigna req.user y llama a next()', () => {
    const payload = { id: 1, email: 'a@b.com', name: 'Ana' }
    ;(jwt.verify as jest.Mock).mockReturnValue(payload)
    const req: any = makeReq('Bearer token-bueno')
    const next = jest.fn()

    authJwt(req, {} as any, next)

    expect(req.user).toEqual(payload)
    expect(next).toHaveBeenCalledWith()
  })

  test('token inválido o expirado → ApiError 401 "Invalid token"', () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired')
    })
    const req: any = makeReq('Bearer token-roto')
    const next = jest.fn()

    authJwt(req, {} as any, next)

    expect(req.user).toBeUndefined()
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(401)
    expect(err.message).toBe('Invalid token')
  })
})