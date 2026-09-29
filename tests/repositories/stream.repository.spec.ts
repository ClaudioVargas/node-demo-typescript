import { Readable } from 'stream'
import {
  createStream,
  createBuffer,
  nasaStream,
  imageBuffer,
} from '../../src/repository/stream.repository'

jest.mock('stream', () => ({
  __esModule: true,
  Readable: { from: jest.fn(() => ({ pipe: jest.fn() })) },
}))

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('stream.repository', () => {
  const fetchMock = jest.fn()

  beforeAll(() => {
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true, configurable: true })
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function makeFetchResponse(overrides: any = {}): any {
    return Object.assign(
      {
        ok: true,
        status: 200,
        headers: { get: (name: string) => (name === 'content-type' ? 'application/json' : '') },
        body: undefined,
        json: async () => ({ explanation: 'x' }),
        text: async () => '',
        arrayBuffer: async () => new Uint8Array(),
      },
      overrides
    )
  }

  test('createStream expone los chunks de texto en un Readable', () => {
    const stream = createStream()
    expect(stream).toEqual({ pipe: expect.any(Function) })
    expect(Readable.from).toHaveBeenCalledWith(['Hola ', 'desde ', 'streams', '!'])
  })

  test('createBuffer serializa el body a JSON', () => {
    const result = createBuffer({ a: 1 })
    expect(result.originalLength).toBe(7)
    expect(result.slice).toBe('{"a":1}')
  })

  test('createBuffer usa el buffer por defecto si el body está vacío', () => {
    const defaultResult = createBuffer({})
    expect(defaultResult.originalLength).toBe(14)
    // "default-buffer" tiene 14 bytes; slice = primeros 10 bytes
    expect(defaultResult.slice).toBe('default-bu')

    expect(createBuffer(undefined as any).originalLength).toBe(14)
  })

  test('nasaStream devuelve un error tipado si la API responde con error', async () => {
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({ ok: false, status: 500, text: async () => 'problem' })
    )

    const result = await nasaStream()

    expect(result.type).toBe('error')
    expect(result.status).toBe(502)
    expect(result.value.error).toContain('500')
  })

  test('nasaStream devuelve JSON si content-type es application/json', async () => {
    const value = { title: 'Nebulosa', date: '2026-09-28' }
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({ json: async () => value })
    )

    const result = await nasaStream()

    expect(result.type).toBe('json')
    expect(result.value).toEqual(value)
  })

  test('nasaStream lee binario vía getReader si el cuerpo lo expone', async () => {
    let calls = 0
    const reader = {
      read: async () => {
        calls++
        if (calls === 1) return { value: new Uint8Array([104, 105]), done: false }
        if (calls === 2) return { value: new Uint8Array([106]), done: false }
        return { done: true }
      },
    }
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        headers: { get: () => 'image/webp' },
        body: { getReader: () => reader },
      })
    )

    const result = await nasaStream()

    expect(result.type).toBe('binary')
    expect(result.contentType).toBe('image/webp')
    expect((result.value as Buffer).length).toBe(3)
  })

  test('nasaStream usa arrayBuffer como fallback para contenido image/*', async () => {
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new Uint8Array([9, 9]),
      })
    )

    const result = await nasaStream()

    expect(result.type).toBe('binary')
    expect((result.value as Buffer).length).toBe(2)
  })

  test('nasaStream hace fallback a texto si no es JSON ni imagen', async () => {
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        headers: { get: () => 'text/plain' },
        text: async () => 'Hola desde NASA',
      })
    )

    const result = await nasaStream()

    expect(result.type).toBe('text')
    expect(result.value).toBe('Hola desde NASA')
  })

  test('nasaStream devuelve error 502 si fetch lanza una excepción', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const result = await nasaStream()

    expect(result.type).toBe('error')
    expect(result.status).toBe(502)
    expect(result.value.error).toContain('Error al consultar la API de la NASA')
  })

  test('imageBuffer devuelve longitud y slice hex de la imagen', async () => {
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        body: { algunos: 'bytes' },
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]),
      })
    )

    const result = await imageBuffer()

    expect(result).not.toBeNull()
    expect((result as any).length).toBe(4)
    expect((result as any).slice).toBe('01020304')
  })

  test('imageBuffer devuelve null si la respuesta no trae cuerpo', async () => {
    fetchMock.mockResolvedValueOnce(makeFetchResponse({ body: undefined }))

    expect(await imageBuffer()).toBeNull()
  })

  test('imageBuffer devuelve null si fetch lanza una excepción', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    expect(await imageBuffer()).toBeNull()
  })
})