import { errorHandler } from '../../src/validators/errorHandler'
import { ApiError } from '../../src/validators/apiError'

describe('errorHandler', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('responde con el status y detalles para un ApiError', () => {
    const err = new ApiError(422, 'Validación falló', { campo: 'email' })
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()
    const res: any = { status, json }

    errorHandler(err, {} as any, res, jest.fn())

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(422)
    expect(json).toHaveBeenCalledWith({ error: 'Validación falló', details: { campo: 'email' } })
  })

  test('responde 500 y loguea el error para un error genérico', () => {
    const err = new Error('boom')
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()
    const res: any = { status, json }

    errorHandler(err, {} as any, res, jest.fn())

    expect(consoleErrorSpy).toHaveBeenCalledWith(err)
    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
  })
})