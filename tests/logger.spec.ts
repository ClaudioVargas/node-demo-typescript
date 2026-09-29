import fs from 'fs'
import path from 'path'
import { logger } from '../src/utils/logger'

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    mkdirSync: jest.fn(),
    appendFileSync: jest.fn(),
  },
}))

jest.mock('path', () => ({
  __esModule: true,
  default: { join: (...parts: string[]) => parts.join('/') },
}))

describe('utils/logger', () => {
  let appendFileSync: any
  let logSpy: any
  let warnSpy: any
  let errorSpy: any

  beforeEach(() => {
    appendFileSync = (fs as any).appendFileSync
    appendFileSync.mockClear()
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = jest.spyOn(console as any, 'warn').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  test('info escribe a consola y al archivo con el formato estructurado', () => {
    logger.info('Contexto', 'mensaje', { id: 1 })

    const line = logSpy.mock.calls[0][0]
    expect(line).toContain('[INFO]')
    expect(line).toContain('[Contexto]')
    expect(line).toContain('mensaje')
    expect(line).toContain('{"id":1}')

    expect(appendFileSync).toHaveBeenCalled()
    const filePath = String(appendFileSync.mock.calls[0][0])
    const fileLine = String(appendFileSync.mock.calls[0][1])
    expect(filePath).toContain('app.log')
    expect(fileLine).toContain('[INFO]')
  })

  test('warn usa console.warn y la etiqueta [WARN]', () => {
    logger.warn('Contexto', 'algo raro')

    expect(warnSpy).toHaveBeenCalled()
    expect(String(warnSpy.mock.calls[0][0])).toContain('[WARN]')
  })

  test('error con meta Error incluye mensaje y stack en la línea', () => {
    logger.error('Contexto', 'falló', new Error('boom'))

    expect(errorSpy).toHaveBeenCalled()
    const line = String(errorSpy.mock.calls[0][0])
    expect(line).toContain('[ERROR]')
    expect(line).toContain('boom')
  })

  test('un objeto cíclico no rompe el log (cae a String(value))', () => {
    const circular: any = { name: 'x' }
    circular.self = circular

    logger.info('Contexto', 'meta circular', circular)

    const line = logSpy.mock.calls[0][0]
    expect(line).toContain('[object Object]')
  })

  test('un valor primitivo se serializa con String()', () => {
    logger.info('Contexto', 'primitivo', 42)

    expect(String(logSpy.mock.calls[0][0])).toContain('42')
  })

  test('si falla la escritura al archivo, el log de consola igual se emite', () => {
    appendFileSync.mockImplementationOnce(() => {
      throw new Error('sin permisos')
    })

    logger.error('Contexto', 'mensaje')

    expect(errorSpy).toHaveBeenCalled()
  })
})