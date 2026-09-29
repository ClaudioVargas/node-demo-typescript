const EXPECTED_SPEC = {
  openapi: '3.0.0',
  info: { title: 'API' },
  paths: {},
  components: {},
}

jest.mock('swagger-jsdoc', () =>
  jest.fn(() => ({ openapi: '3.0.0', info: { title: 'API' }, paths: {}, components: {} }))
)

import { setupSwagger } from '../src/swagger'
import swaggerUi from 'swagger-ui-express'

jest.mock('swagger-ui-express', () => ({
  serve: 'serve-handler',
  setup: jest.fn(() => 'setup-handler'),
}))

describe('swagger', () => {
  test('monta la UI en /docs y expone el JSON de la spec en /docs/json', () => {
    const use = jest.fn()
    const get = jest.fn()
    setupSwagger({ use, get } as any)

    expect(use).toHaveBeenCalledWith('/docs', expect.any(Function))
    expect(use).toHaveBeenCalledWith('/docs', 'serve-handler', 'setup-handler')
    expect(get).toHaveBeenCalledWith('/docs/json', expect.any(Function))
    expect(swaggerUi.setup).toHaveBeenCalledWith(EXPECTED_SPEC)
  })

  test('GET /docs/json devuelve la spec con Cache-Control no-store', () => {
    const use = jest.fn()
    const get = jest.fn()
    setupSwagger({ use, get } as any)

    const call = get.mock.calls.find((c: any[]) => c[0] === '/docs/json')
    const handler = call[1]
    const setHeader = jest.fn()
    const json = jest.fn()

    handler({}, { setHeader, json })

    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(json).toHaveBeenCalledWith(EXPECTED_SPEC)
  })

  test('el middleware de /docs añade Cache-Control no-store y continúa', () => {
    const use = jest.fn()
    setupSwagger({ use, get: jest.fn() } as any)

    const call = use.mock.calls.find((c: any[]) => c[0] === '/docs')
    const middleware = call[1]
    const setHeader = jest.fn()
    const next = jest.fn()

    middleware({}, { setHeader }, next)

    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(next).toHaveBeenCalled()
  })
})