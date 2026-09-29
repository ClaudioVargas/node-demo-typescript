import { ApiError } from '../../src/validators/apiError'

describe('ApiError', () => {
  test('expone status, message y details', () => {
    const err = new ApiError(404, 'No encontrado', { id: 3 })
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(404)
    expect(err.message).toBe('No encontrado')
    expect(err.details).toEqual({ id: 3 })
  })

  test('details es opcional', () => {
    const err = new ApiError(400, 'Bad request')
    expect(err.details).toBeUndefined()
  })

  test('instanceof ApiError funciona (prototipo restaurado con setPrototypeOf)', () => {
    const err = new ApiError(401, 'No autorizado')
    expect(Object.getPrototypeOf(err)).toBe(ApiError.prototype)
  })
})