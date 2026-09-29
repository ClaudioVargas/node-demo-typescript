import { getRoles, postRole, putRole, deleteRole } from '../../src/controllers/role.controller'
import { findRoles, createRole, updateRole } from '../../src/repository/role.repository'

jest.mock('../../src/repository/role.repository', () => ({
  findRoles: jest.fn(),
  createRole: jest.fn(),
  updateRole: jest.fn(),
}))

describe('role.controller', () => {
  function makeRes(): any {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() }
  }
  function makeReq(overrides: any = {}): any {
    return Object.assign({ body: {}, params: {}, headers: {} }, overrides)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getRoles devuelve 200 con la lista', async () => {
    const roles = [{ id: 1, nombre: 'ADMIN' }]
    ;(findRoles as jest.Mock).mockResolvedValue(roles)
    const res = makeRes()

    await getRoles({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(roles)
  })

  test('postRole devuelve 201 con el rol creado', async () => {
    const role = { id: 2, nombre: 'USER' }
    ;(createRole as jest.Mock).mockResolvedValue(role)
    const res = makeRes()

    await postRole(makeReq({ body: { nombre: 'USER' } }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ msg: role })
  })

  test('putRole devuelve 201 con el rol actualizado', async () => {
    const role = { id: 1, nombre: 'ADMIN' }
    ;(updateRole as jest.Mock).mockResolvedValue(role)
    const res = makeRes()

    await putRole(makeReq({ params: { id: '1' }, body: { descripcion: 'x' } }), res)

    expect(updateRole).toHaveBeenCalledWith('1', { descripcion: 'x' })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('putRole devuelve 500 si el repositorio lanza', async () => {
    ;(updateRole as jest.Mock).mockRejectedValue(new Error('Rol no encontrado'))
    const res = makeRes()

    await putRole(makeReq({ params: { id: '99' }, body: {} }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  test('deleteRole responde con el id del rol (placeholder)', async () => {
    const res = makeRes()

    await deleteRole(makeReq({ params: { id: '1' } }), res)

    expect(res.json).toHaveBeenCalledWith({ msg: 'deleteRole', id: '1' })
  })
})