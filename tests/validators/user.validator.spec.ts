import express from 'express'
import request from 'supertest'
import usuarioRouter from '../../src/routes/usuario.router'
import { createUsuario, updateUsuario } from '../../src/repository/usuario.repository'

jest.mock('../../src/repository/usuario.repository', () => ({
  findUsuarios: jest.fn(),
  findUsuario: jest.fn(),
  createUsuario: jest.fn(),
  likeTema: jest.fn(),
  updateUsuario: jest.fn(),
  deleteUsuario: jest.fn(),
}))

describe('validadores de usuario (ValidateCreate / ValidateUpdate)', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/api/usuarios', usuarioRouter)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('POST válido supera la validación y llega al controlador', async () => {
    ;(createUsuario as jest.Mock).mockResolvedValue({ id: 1, name: 'Ana', email: 'ana@mail.com', isActive: true })

    const res = await request(app)
      .post('/api/usuarios')
      .send({ name: 'Ana', email: 'ana@mail.com', password: 'secreta' })

    expect(res.status).toBe(201)
    expect(createUsuario).toHaveBeenCalled()
  })

  test('POST sin name responde 403', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ email: 'ana@mail.com', password: 'x' })

    expect(res.status).toBe(403)
    expect(createUsuario).not.toHaveBeenCalled()
  })

  test('POST sin email responde 403', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ name: 'Ana', password: 'x' })

    expect(res.status).toBe(403)
  })

  test('POST con email inválido responde 403', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ name: 'Ana', email: 'no-es-un-email', password: 'x' })

    expect(res.status).toBe(403)
  })

  test('PUT sin email pasa la validación (campo opcional)', async () => {
    ;(updateUsuario as jest.Mock).mockResolvedValue(true)

    const res = await request(app)
      .put('/api/usuarios')
      .send({ id: 1, name: 'Ana' })

    expect(res.status).toBe(200)
    expect(updateUsuario).toHaveBeenCalledWith({ id: 1, name: 'Ana' })
  })

  test('PUT con email inválido responde 403 (opcional pero validado si viene)', async () => {
    const res = await request(app)
      .put('/api/usuarios')
      .send({ id: 1, name: 'Ana', email: 'no-es-un-email' })

    expect(res.status).toBe(403)
    expect(updateUsuario).not.toHaveBeenCalled()
  })

  test('PUT sin name responde 403', async () => {
    const res = await request(app)
      .put('/api/usuarios')
      .send({ id: 1, email: 'ana@mail.com' })

    expect(res.status).toBe(403)
  })
})