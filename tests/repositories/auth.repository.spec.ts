import jwt from 'jsonwebtoken'
import { hashPassword, signup, login, logout } from '../../src/repository/auth.repository'
import { addTokenToBlacklist } from '../../src/validators/tokenBlacklist'
import { Usuario } from '../../src/models/usuario.model'

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'token-firmado'),
  decode: jest.fn(),
  verify: jest.fn(),
}))

jest.mock('../../src/validators/tokenBlacklist', () => ({
  addTokenToBlacklist: jest.fn(),
}))

jest.mock('../../src/models/usuario.model', () => ({
  Usuario: { findOne: jest.fn(), create: jest.fn() },
}))

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('auth.repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    test('genera el formato salt$derived (salt 32 hex, derived 128 hex)', () => {
      const [salt, derived] = hashPassword('miclave').split('$')
      expect(salt).toMatch(/^[0-9a-f]{32}$/)
      expect(derived).toMatch(/^[0-9a-f]{128}$/)
    })

    test('usa un salt distinto para la misma contraseña', () => {
      expect(hashPassword('miclave')).not.toBe(hashPassword('miclave'))
    })
  })

  describe('signup', () => {
    test('crea el usuario con la contraseña hasheada si el email es nuevo', async () => {
      ;(Usuario.findOne as jest.Mock).mockResolvedValue(null)
      ;(Usuario.create as jest.Mock).mockResolvedValue({ id: 2, name: 'Ana', email: 'ana@m.com' })

      const user = await signup('Ana', 'ana@m.com', 'secreta')

      expect(user).toEqual({ id: 2, name: 'Ana', email: 'ana@m.com' })
      const createArg = (Usuario.create as jest.Mock).mock.calls[0][0]
      expect(createArg.email).toBe('ana@m.com')
      expect(createArg.password).not.toBe('secreta')
      expect(createArg.password).toMatch(/\$/)
    })

    test('devuelve null si el email ya existe', async () => {
      ;(Usuario.findOne as jest.Mock).mockResolvedValue({ id: 1 })

      expect(await signup('Ana', 'ana@m.com', 'secreta')).toBeNull()
      expect(Usuario.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    test('devuelve un JWT con credenciales válidas', async () => {
      const hashed = hashPassword('buena-clave')
      ;(Usuario.findOne as jest.Mock).mockResolvedValue({
        id: 5,
        name: 'Ana',
        email: 'ana@m.com',
        password: hashed,
      })

      const token = await login('ana@m.com', 'buena-clave')

      expect(token).toBe('token-firmado')
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 5, email: 'ana@m.com', name: 'Ana' },
        expect.any(String),
        { expiresIn: '1h' }
      )
    })

    test('devuelve null con contraseña incorrecta', async () => {
      ;(Usuario.findOne as jest.Mock).mockResolvedValue({
        id: 5,
        name: 'Ana',
        email: 'ana@m.com',
        password: hashPassword('buena-clave'),
      })

      expect(await login('ana@m.com', 'clave-mala')).toBeNull()
      expect(jwt.sign).not.toHaveBeenCalled()
    })

    test('devuelve null si el usuario no existe', async () => {
      ;(Usuario.findOne as jest.Mock).mockResolvedValue(null)

      expect(await login('nadie@m.com', 'x')).toBeNull()
    })
  })

  describe('logout', () => {
    test('agrega el token a la blacklist con el exp del token', () => {
      ;(jwt.decode as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })

      logout('token-abc')

      expect(addTokenToBlacklist).toHaveBeenCalledWith('token-abc', expect.any(Number))
    })

    test('re-lanza el error si el token no se puede decodificar', () => {
      ;(jwt.decode as jest.Mock).mockImplementation(() => {
        throw new Error('decode falló')
      })

      expect(() => logout('token-roto')).toThrow('decode falló')
    })
  })
})