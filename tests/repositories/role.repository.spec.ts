import { findRoles, createRole, updateRole } from '../../src/repository/role.repository'
import { Role } from '../../src/models/role.model'

jest.mock('../../src/models/role.model', () => ({
  Role: Object.assign(class {}, {
    findAll: jest.fn(),
    create: jest.fn(),
    sync: jest.fn(async () => 0),
    findByPk: jest.fn(),
  }) as any,
}))

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('role.repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('findRoles devuelve la lista completa', async () => {
    const roles = [{ id: 1, nombre: 'ADMIN' }]
    ;(Role.findAll as jest.Mock).mockResolvedValue(roles)

    expect(await findRoles()).toEqual(roles)
  })

  test('createRole crea el rol con timestamps', async () => {
    ;(Role.create as jest.Mock).mockResolvedValue({ id: 2, nombre: 'USER' })

    const creado = await createRole({ nombre: 'USER', descripcion: 'Estándar' })

    expect(creado).toEqual({ id: 2, nombre: 'USER' })
    const arg = (Role.create as jest.Mock).mock.calls[0][0]
    expect(arg.createdAt).toBeInstanceOf(Date)
    expect(arg.updatedAt).toBeInstanceOf(Date)
  })

  test('updateRole lanza un error si el rol no existe', async () => {
    ;(Role.findByPk as jest.Mock).mockResolvedValue(null)

    await expect(updateRole('99', { descripcion: 'x' })).rejects.toThrow(/no encontrado/)
  })

  test('updateRole actualiza los campos del body y devuelve el rol', async () => {
    const update = jest.fn(async (..._args: any[]) => 0)
    const role = { id: 1, nombre: 'ADMIN', update }
    ;(Role.findByPk as jest.Mock).mockResolvedValue(role)

    const result = await updateRole('1', { descripcion: 'Nueva desc' })

    expect(result).toEqual(role)
    const arg = update.mock.calls[0][0]
    expect(arg.descripcion).toBe('Nueva desc')
    expect(arg.updatedAt).toBeInstanceOf(Date)
  })
})