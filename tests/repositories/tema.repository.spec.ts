import { findTemas, findTema, createTema, updateTema, deleteTema } from '../../src/repository/tema.repository'
import { Tema } from '../../src/models/tema.model'

jest.mock('../../src/models/tema.model', () => {
  class TemaCls {
    name: any
    constructor(body: any) {
      Object.assign(this, body)
    }
  }
  return {
    Tema: Object.assign(TemaCls, {
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      sync: jest.fn(async () => 0),
    }) as any,
  }
})

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('tema.repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('findTemas devuelve la lista completa', async () => {
    const lista = [{ id: 1, name: 'Node' }]
    ;(Tema.findAll as jest.Mock).mockResolvedValue(lista)

    expect(await findTemas()).toEqual(lista)
  })

  test('findTema devuelve el tema encontrado', async () => {
    const tema = { id: 1, name: 'Node' }
    ;(Tema.findByPk as jest.Mock).mockResolvedValue(tema)

    expect(await findTema('1')).toEqual(tema)
  })

  test('findTema devuelve null si no existe', async () => {
    ;(Tema.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await findTema('999')).toBeNull()
  })

  test('createTema devuelve null si el nombre ya existe', async () => {
    ;(Tema.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    expect(await createTema({ name: 'Node' })).toBeNull()
    expect(Tema.create).not.toHaveBeenCalled()
  })

  test('createTema crea con isActive y timestamps', async () => {
    ;(Tema.findOne as jest.Mock).mockResolvedValue(null)
    ;(Tema.create as jest.Mock).mockResolvedValue({ id: 2, name: 'Node' })

    const creado = await createTema({ name: 'Node', descripcion: 'runtime' })

    expect(creado).toEqual({ id: 2, name: 'Node' })
    const arg = (Tema.create as jest.Mock).mock.calls[0][0]
    expect(arg.isActive).toBe(true)
    expect(arg.createdAt).toBeInstanceOf(Date)
    expect(arg.updatedAt).toBeInstanceOf(Date)
  })

  test('updateTema devuelve false si el tema no existe', async () => {
    ;(Tema.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await updateTema({ id: 9, name: 'X' })).toBe(false)
  })

  test('updateTema aplica set() y save()', async () => {
    const set = jest.fn()
    const save = jest.fn(async () => 0)
    ;(Tema.findByPk as jest.Mock).mockResolvedValue({ set, save })

    expect(await updateTema({ id: 1, name: 'Nuevo' })).toBe(true)
    const arg = set.mock.calls[0][0]
    expect(arg.name).toBe('Nuevo')
    expect(arg.updatedAt).toBeInstanceOf(Date)
    expect(save).toHaveBeenCalled()
  })

  test('deleteTema devuelve false si el tema no existe', async () => {
    ;(Tema.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await deleteTema('9')).toBe(false)
  })

  test('deleteTema elimina el tema existente', async () => {
    const destroy = jest.fn(async () => 0)
    ;(Tema.findByPk as jest.Mock).mockResolvedValue({ destroy })

    expect(await deleteTema('1')).toBe(true)
    expect(destroy).toHaveBeenCalled()
  })
})