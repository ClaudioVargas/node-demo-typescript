import {
  addTokenToBlacklist,
  isTokenBlacklisted,
  cleanupBlacklist,
} from '../../src/validators/tokenBlacklist'

describe('tokenBlacklist', () => {
  const BASE = 1_700_000_000_000
  let nowSpy: any

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(BASE)
  })
  afterEach(() => {
    nowSpy.mockRestore()
  })

  test('devuelve true para un token en blacklist no expirado', () => {
    addTokenToBlacklist('token-activo', 3600)
    expect(isTokenBlacklisted('token-activo')).toBe(true)
  })

  test('usa un TTL por defecto de 1 hora', () => {
    addTokenToBlacklist('token-defecto')
    expect(isTokenBlacklisted('token-defecto')).toBe(true)

    nowSpy.mockReturnValue(BASE + 60 * 60 * 1000 + 1)
    expect(isTokenBlacklisted('token-defecto')).toBe(false)
  })

  test('un token expirado deja de estar en blacklist al consultarse', () => {
    addTokenToBlacklist('token-corto', 1)
    expect(isTokenBlacklisted('token-corto')).toBe(true)

    nowSpy.mockReturnValue(BASE + 1001)
    expect(isTokenBlacklisted('token-corto')).toBe(false)
  })

  test('un token desconocido nunca está en blacklist', () => {
    expect(isTokenBlacklisted('token-inexistente')).toBe(false)
  })

  test('cleanupBlacklist elimina solo los tokens vencidos', () => {
    addTokenToBlacklist('token-vencido', 1)
    addTokenToBlacklist('token-vigente', 3600)

    nowSpy.mockReturnValue(BASE + 1001)
    cleanupBlacklist()

    expect(isTokenBlacklisted('token-vencido')).toBe(false)
    expect(isTokenBlacklisted('token-vigente')).toBe(true)
  })
})