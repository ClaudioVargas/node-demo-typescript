import {
  findUsuarios,
  findUsuario,
  createUsuario,
  likeTema,
  updateUsuario,
  updatePassword,
  deleteUsuario,
} from '../../src/repository/usuario.repository'
import { Usuario } from '../../src/models/usuario.model'
import { UsuarioTema } from '../../src/models/usuarioTemas.model'
import { Tema } from '../../src/models/tema.model'

jest.mock('../../src/repository/auth.repository', () => ({
  hashPassword: jest.fn((p: string) => `hash:${p}`),
}))

jest.mock('../../src/models/usuario.model', () => ({
  Usuario: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    sync: jest.fn(async () => 0),
  },
}))

jest.mock('../../src/models/tema.model', () => ({
  Tema: { findOne: jest.fn() },
}))

jest.mock('../../src/models/usuarioTemas.model', () => {
  class UsuarioTemaCls {
    usuarioId: any
    temaId: any
    constructor(body: any) {
      Object.assign(this, body)
    }
  }
  return {
    UsuarioTema: Object.assign(UsuarioTemaCls, {
      sync: jest.fn(async () => 0),
      findOne: jest.fn(),
      create: jest.fn(),
    }) as any,
  }
})

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('usuario.repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('findUsuarios devuelve la lista completa', async () => {
    const lista = [{ id: 1, name: 'Ana' }, { id: 2, name: 'Luis' }]
    ;(Usuario.findAll as jest.Mock).mockResolvedValue(lista)

    expect(await findUsuarios()).toEqual(lista)
  })

  test('findUsuario devuelve el usuario encontrado', async () => {
    const user = { id: 1, name: 'Ana' }
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue(user)

    expect(await findUsuario('1')).toEqual(user)
  })

  test('findUsuario devuelve null si no existe', async () => {
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await findUsuario('999')).toBeNull()
  })

  test('createUsuario rechaza un email duplicado', async () => {
    ;(Usuario.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    expect(await createUsuario({ name: 'Ana', email: 'ana@m.com', password: 'x' })).toBeNull()
    expect(Usuario.create).not.toHaveBeenCalled()
  })

  test('createUsuario hashea la contraseña y crea el usuario', async () => {
    ;(Usuario.findOne as jest.Mock).mockResolvedValue(null)
    ;(Usuario.create as jest.Mock).mockResolvedValue({ id: 3, name: 'Ana', email: 'ana@m.com' })

    const user = await createUsuario({ name: 'Ana', email: 'ana@m.com', password: 'secreta' })

    expect(user).toEqual({ id: 3, name: 'Ana', email: 'ana@m.com' })
    expect(Usuario.sync).toHaveBeenCalledWith({ alter: true })
    const arg = (Usuario.create as jest.Mock).mock.calls[0][0]
    expect(arg.password).toBe('hash:secreta')
    expect(arg.createdAt).toBeInstanceOf(Date)
    expect(arg.updatedAt).toBeInstanceOf(Date)
  })

  describe('likeTema', () => {
    const body = { usuarioId: 1, temaId: 2 }

    test('falla si el usuario destino no existe', async () => {
      ;(Tema.findOne as jest.Mock).mockResolvedValueOnce(null)

      expect(await likeTema(body)).toEqual({ error: 'usuario' })
    })

    test('falla si el tema no existe', async () => {
      ;(Tema.findOne as jest.Mock).mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null)

      expect(await likeTema(body)).toEqual({ error: 'tema' })
    })

    test('falla si el like ya existe', async () => {
      ;(Tema.findOne as jest.Mock).mockResolvedValue({ id: 1 })
      ;(UsuarioTema.findOne as jest.Mock).mockResolvedValue({ id: 8 })

      expect(await likeTema(body)).toEqual({ error: 'exists' })
    })

    test('registra el like si todo es válido', async () => {
      ;(Tema.findOne as jest.Mock).mockResolvedValue({ id: 1 })
      ;(UsuarioTema.findOne as jest.Mock).mockResolvedValue(null)
      ;(UsuarioTema.create as jest.Mock).mockResolvedValue({ id: 9, usuarioId: 1, temaId: 2 })

      const result = await likeTema(body)

      expect((result as any).response).toEqual({ id: 9, usuarioId: 1, temaId: 2 })
      const arg = (UsuarioTema.create as jest.Mock).mock.calls[0][0]
      expect(arg.createdAt).toBeInstanceOf(Date)
      expect(arg.updatedAt).toBeInstanceOf(Date)
    })
  })

  test('updateUsuario devuelve false si el usuario no existe', async () => {
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await updateUsuario({ id: 99, name: 'X' })).toBe(false)
  })

  test('updateUsuario actualiza solo los campos del body', async () => {
    const update = jest.fn(async () => 0)
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue({ update })

    expect(await updateUsuario({ id: 1, name: 'Nuevo' })).toBe(true)
    expect(update).toHaveBeenCalledWith({ id: 1, name: 'Nuevo' })
  })

  test('updatePassword devuelve false si el usuario no existe', async () => {
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await updatePassword(99, 'nueva')).toBe(false)
  })

  test('updatePassword guarda la contraseña hasheada', async () => {
    const update = jest.fn(async () => 0)
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue({ update })

    expect(await updatePassword(1, 'nueva')).toBe(true)
    expect(update).toHaveBeenCalledWith({ password: 'hash:nueva' })
  })

  test('deleteUsuario devuelve false si el usuario no existe', async () => {
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await deleteUsuario('99')).toBe(false)
  })

  test('deleteUsuario elimina al usuario existente', async () => {
    const destroy = jest.fn(async () => 0)
    ;(Usuario.findByPk as jest.Mock).mockResolvedValue({ destroy })

    expect(await deleteUsuario('1')).toBe(true)
    expect(destroy).toHaveBeenCalled()
  })
})