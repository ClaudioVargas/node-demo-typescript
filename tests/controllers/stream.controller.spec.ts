import { getStream, postBuffer, nasaStream, imageBuffer } from '../../src/controllers/stream.comtroller'
import {
  createStream,
  createBuffer,
  nasaStream as fetchNasa,
  imageBuffer as fetchImage,
} from '../../src/repository/stream.repository'

jest.mock('../../src/repository/stream.repository', () => ({
  createStream: jest.fn(() => ({ pipe: jest.fn() })),
  createBuffer: jest.fn(),
  nasaStream: jest.fn(),
  imageBuffer: jest.fn(),
}))

describe('stream.controller', () => {
  function makeRes(extra: any = {}): any {
    return Object.assign({ status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), end: jest.fn() }, extra)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getStream fija content-type text/plain y hace pipe del stream', async () => {
    const pipe = jest.fn()
    ;(createStream as jest.Mock).mockReturnValue({ pipe })
    const res = makeRes()

    await getStream({} as any, res)

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8')
    expect(pipe).toHaveBeenCalledWith(res)
  })

  test('postBuffer devuelve la info del buffer creado', async () => {
    const info = { originalLength: 10, slice: 'abc' }
    ;(createBuffer as jest.Mock).mockReturnValue(info)
    const res = makeRes()

    await postBuffer({ body: { a: 1 } } as any, res)

    expect(createBuffer).toHaveBeenCalledWith({ a: 1 })
    expect(res.json).toHaveBeenCalledWith(info)
  })

  test('nasaStream responde el JSON tal cual', async () => {
    const value = { title: 'Nebulosa' }
    ;(fetchNasa as jest.Mock).mockResolvedValue({ type: 'json', value })
    const res = makeRes()

    await nasaStream({} as any, res)

    expect(res.json).toHaveBeenCalledWith(value)
  })

  test('nasaStream responde el status y error si la fuente falla', async () => {
    ;(fetchNasa as jest.Mock).mockResolvedValue({ type: 'error', status: 502, value: { error: 'ups' } })
    const res = makeRes()

    await nasaStream({} as any, res)

    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({ error: 'ups' })
  })

  test('nasaStream sirve contenido binario con headers de no-caché', async () => {
    const buffer = Buffer.from([1, 2])
    ;(fetchNasa as jest.Mock).mockResolvedValue({ type: 'binary', contentType: 'image/webp', value: buffer })
    const res = makeRes()

    await nasaStream({} as any, res)

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/webp')
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
    expect(res.end).toHaveBeenCalledWith(buffer)
  })

  test('nasaStream envía texto plano cuando el tipo es text', async () => {
    ;(fetchNasa as jest.Mock).mockResolvedValue({ type: 'text', value: 'hola' })
    const type = jest.fn().mockReturnThis()
    const send = jest.fn()
    const res: any = { type, send }

    await nasaStream({} as any, res)

    expect(type).toHaveBeenCalledWith('text')
    expect(send).toHaveBeenCalledWith('hola')
  })

  test('imageBuffer devuelve 200 con los datos de la imagen', async () => {
    const info = { length: 200, slice: 'ffd8' }
    ;(fetchImage as jest.Mock).mockResolvedValue(info)
    const res = makeRes()

    await imageBuffer({} as any, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(info)
  })

  test('imageBuffer devuelve 502 si la API de imágenes falla', async () => {
    ;(fetchImage as jest.Mock).mockResolvedValue(null)
    const res = makeRes()

    await imageBuffer({} as any, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({ error: 'La API de Picsum no devolvió datos válidos.' })
  })

  test('imageBuffer propaga el error a next', async () => {
    const error = new Error('boom')
    ;(fetchImage as jest.Mock).mockRejectedValue(error)
    const next = jest.fn()

    await imageBuffer({} as any, makeRes(), next)

    expect(next).toHaveBeenCalledWith(error)
  })
})