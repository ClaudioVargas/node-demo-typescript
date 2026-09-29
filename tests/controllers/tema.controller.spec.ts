import {
  getTemas,
  getTema,
  postTema,
  putTema,
  eliminarTema,
} from '../../src/controllers/tema.controller'
import {
  findTemas,
  findTema,
  createTema,
  updateTema,
  deleteTema,
} from '../../src/repository/tema.repository'

jest.mock('../../src/repository/tema.repository', () => ({
  findTemas: jest.fn(),
  findTema: jest.fn(),
  createTema: jest.fn(),
  updateTema: jest.fn(),
  deleteTema: jest.fn(),
}))

describe('tema.controller', () => {
  function makeRes(): any {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() }
  }
  function makeReq(overrides: any = {}): any {
    return Object.assign({ body: {}, params: {}, headers: {} }, overrides)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getTemas devuelve 200 con la lista', async () => {
    const lista = [{ id: 1, name: 'Node' }]
    ;(findTemas as jest.Mock).mockResolvedValue(lista)
    const res = makeRes()

    await getTemas({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(lista)
  })

  test('getTema devuelve 200 con el tema', async () => {
    const tema = { id: 1, name: 'Node' }
    ;(findTema as jest.Mock).mockResolvedValue(tema)
    const res = makeRes()

    await getTema(makeReq({ params: { id: '1' } }), res)

    expect(res.json).toHaveBeenCalledWith(tema)
  })

  test('getTema devuelve 404 si no existe', async () => {
    ;(findTema as jest.Mock).mockResolvedValue(null)
    const res = makeRes()

    await getTema(makeReq({ params: { id: '999' } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ msg: 'Tema con id 999 no encontrado' })
  })

  test('postTema devuelve 409 si el nombre está duplicado', async () => {
    ;(createTema as jest.Mock).mockResolvedValue(null)
    const res = makeRes()

    await postTema(makeReq({ body: { email: 'dupe@tema' } }), res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ msg: 'Email dupe@tema ya existe' })
  })

  test('postTema devuelve 200 con el tema creado', async () => {
    const creado = { id: 2, name: 'Node' }
    ;(createTema as jest.Mock).mockResolvedValue(creado)
    const res = makeRes()

    await postTema(makeReq({ body: { name: 'Node' } }), res)

    expect(res.json).toHaveBeenCalledWith({ msg: creado })
  })

  test('putTema devuelve 200 si se actualiza', async () => {
    ;(updateTema as jest.Mock).mockResolvedValue(true)
    const res = makeRes()

    await putTema(makeReq({ body: { id: 1, name: 'Nuevo' } }), res)

    expect(res.json).toHaveBeenCalledWith({ src: 'usuario editado correctamente' })
  })

  test('putTema devuelve 409 si no existe', async () => {
    ;(updateTema as jest.Mock).mockResolvedValue(false)
    const res = makeRes()

    await putTema(makeReq({ body: { id: 1, name: 'Nuevo' } }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('eliminarTema devuelve 200 si se elimina', async () => {
    ;(deleteTema as jest.Mock).mockResolvedValue(true)
    const res = makeRes()

    await eliminarTema(makeReq({ params: { id: '1' } }), res)

    expect(res.json).toHaveBeenCalledWith({ src: 'usuario eliminado correctamente' })
  })

  test('eliminarTema devuelve 409 si no existe', async () => {
    ;(deleteTema as jest.Mock).mockResolvedValue(false)
    const res = makeRes()

    await eliminarTema(makeReq({ params: { id: '1' } }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })
})