import {
  getUsuarios,
  getUsuario,
  postUsuario,
  postLikeTema,
  putUsuario,
  eliminarUsuario,
} from '../../src/controllers/usuarios.controller'
import {
  findUsuarios,
  findUsuario,
  createUsuario,
  likeTema,
  updateUsuario,
  deleteUsuario,
} from '../../src/repository/usuario.repository'

jest.mock('../../src/repository/usuario.repository', () => ({
  findUsuarios: jest.fn(),
  findUsuario: jest.fn(),
  createUsuario: jest.fn(),
  likeTema: jest.fn(),
  updateUsuario: jest.fn(),
  deleteUsuario: jest.fn(),
}))

describe('usuarios.controller', () => {
  function makeRes(): any {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() }
  }
  function makeReq(overrides: any = {}): any {
    return Object.assign({ body: {}, params: {}, headers: {} }, overrides)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getUsuarios devuelve 200 con la lista', async () => {
    const lista = [{ id: 1, name: 'Ana' }]
    ;(findUsuarios as jest.Mock).mockResolvedValue(lista)
    const res = makeRes()

    await getUsuarios({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(lista)
  })

  test('getUsuario devuelve 200 con el usuario', async () => {
    const user = { id: 1, name: 'Ana' }
    ;(findUsuario as jest.Mock).mockResolvedValue(user)
    const res = makeRes()

    await getUsuario(makeReq({ params: { id: '1' } }), res)

    expect(res.json).toHaveBeenCalledWith(user)
  })

  test('getUsuario devuelve 404 si no existe', async () => {
    ;(findUsuario as jest.Mock).mockResolvedValue(null)
    const res = makeRes()

    await getUsuario(makeReq({ params: { id: '999' } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ msg: 'Usuario con id 999 no encontrado' })
  })

  test('postUsuario devuelve 409 si el email ya existe', async () => {
    ;(createUsuario as jest.Mock).mockResolvedValue(null)
    const res = makeRes()
    const req = makeReq({ body: { email: 'a@b.co', name: 'Ana', password: 'x' } })

    await postUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('postUsuario devuelve 201 con el usuario creado', async () => {
    ;(createUsuario as jest.Mock).mockResolvedValue({ id: 1, name: 'Ana', email: 'a@b.co', isActive: true })
    const res = makeRes()
    const req = makeReq({ body: { email: 'a@b.co', name: 'Ana', password: 'x' } })

    await postUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Usuario creado correctamente',
      usuario: { id: 1, name: 'Ana', email: 'a@b.co', isActive: true },
    })
  })

  test('postUsuario devuelve 500 si el repositorio lanza', async () => {
    ;(createUsuario as jest.Mock).mockRejectedValue(new Error('db down'))
    const res = makeRes()

    await postUsuario(makeReq({ body: { email: 'a@b.co' } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  describe('postLikeTema', () => {
    test('409 si el usuario destino no existe', async () => {
      ;(likeTema as jest.Mock).mockResolvedValue({ error: 'usuario' })
      const res = makeRes()
      const req = makeReq({ body: { usuarioId: 5, temaId: 2 } })

      await postLikeTema(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ msg: 'usuario con id 5 no existe' })
    })

    test('409 si el tema no existe', async () => {
      ;(likeTema as jest.Mock).mockResolvedValue({ error: 'tema' })
      const res = makeRes()

      await postLikeTema(makeReq({ body: { usuarioId: 5, temaId: 2 } }), res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ msg: 'tema con id 2 no existe' })
    })

    test('409 si el like ya existe', async () => {
      ;(likeTema as jest.Mock).mockResolvedValue({ error: 'exists' })
      const res = makeRes()

      await postLikeTema(makeReq({ body: { usuarioId: 5, temaId: 2 } }), res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ msg: 'usuarioTema con id: 2 ya existe' })
    })

    test('201 cuando el like se registra', async () => {
      ;(likeTema as jest.Mock).mockResolvedValue({ response: { id: 9 } })
      const res = makeRes()

      await postLikeTema(makeReq({ body: { usuarioId: 5, temaId: 2 } }), res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ msg: { id: 9 } })
    })
  })

  test('putUsuario excluye email y password del body', async () => {
    ;(updateUsuario as jest.Mock).mockResolvedValue(true)
    const res = makeRes()

    await putUsuario(makeReq({ body: { id: 1, email: 'x@y.z', password: 'secreta', name: 'Ana' } }), res)

    expect(updateUsuario).toHaveBeenCalledWith({ id: 1, name: 'Ana' })
    expect(res.json).toHaveBeenCalledWith({ src: 'usuario editado correctamente' })
  })

  test('putUsuario devuelve 409 si el usuario no existe', async () => {
    ;(updateUsuario as jest.Mock).mockResolvedValue(false)
    const res = makeRes()

    await putUsuario(makeReq({ body: { id: 1, name: 'Ana' } }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('eliminarUsuario devuelve 200 si se elimina', async () => {
    ;(deleteUsuario as jest.Mock).mockResolvedValue(true)
    const res = makeRes()

    await eliminarUsuario(makeReq({ params: { id: '1' } }), res)

    expect(res.json).toHaveBeenCalledWith({ src: 'usuario eliminado correctamente' })
  })

  test('eliminarUsuario devuelve 409 si no existe', async () => {
    ;(deleteUsuario as jest.Mock).mockResolvedValue(false)
    const res = makeRes()

    await eliminarUsuario(makeReq({ params: { id: '1' } }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })
})