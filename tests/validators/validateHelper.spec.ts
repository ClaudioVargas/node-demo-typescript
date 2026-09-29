import { validationResult } from 'express-validator'
import validateResult from '../../src/validators/validateHelper'

jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({ throw: jest.fn() })),
}))

describe('validateHelper', () => {
  test('llama next() cuando no hay errores de validación', () => {
    ;(validationResult as any).mockReturnValue({ throw: jest.fn() })
    const next = jest.fn()

    validateResult({}, {}, next)

    expect(next).toHaveBeenCalled()
  })

  test('responde 403 con los errores cuando la validación falla', () => {
    const errors = new Error('email inválido')
    ;(validationResult as any).mockReturnValue({
      throw: jest.fn(() => {
        throw errors
      }),
    })
    const status = jest.fn().mockReturnThis()
    const send = jest.fn()
    const next = jest.fn()

    validateResult({}, { status, send } as any, next)

    expect(status).toHaveBeenCalledWith(403)
    expect(send).toHaveBeenCalledWith(errors)
    expect(next).not.toHaveBeenCalled()
  })
})