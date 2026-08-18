import express from 'express'
import request from 'supertest'
import streamRoutes from '../routes/stream.router'
import { authJwt } from '../validators/authJwt'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'secretKey'

describe('Utils routes (streams / buffer / jwt)', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
    // mount routes
    app.use('/api/utils', streamRoutes)

    // login route for tests (mirrors server behavior)
    app.post('/login', (req, res) => {
      const { username, password } = req.body || {}
      if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' })
        return res.json({ token })
      }
      return res.status(401).json({ error: 'invalid' })
    })

    app.get('/jwt-protected', authJwt, (req, res) => {
      res.json({ ok: true, user: (req as any).user })
    })
  })

  test('GET /api/utils/stream streams text chunks', async () => {
    const res = await request(app).get('/api/utils/stream')
    expect(res.status).toBe(200)
    // the response should contain the concatenated chunks
    expect(res.text).toContain('Hola')
    expect(res.text).toContain('streams')
  })

  test('POST /api/utils/buffer returns buffer info', async () => {
    const payload = { hello: 'world', num: 123 }
    const res = await request(app).post('/api/utils/buffer').send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('originalLength')
    expect(res.body.originalLength).toBeGreaterThan(0)
    expect(res.body).toHaveProperty('slice')
  })

  test('login and access jwt-protected route', async () => {
    const login = await request(app).post('/login').send({ username: 'admin', password: 'password' })
    expect(login.status).toBe(200)
    const token = login.body.token
    expect(token).toBeTruthy()

    const protectedRes = await request(app).get('/jwt-protected').set('Authorization', `Bearer ${token}`)
    expect(protectedRes.status).toBe(200)
    expect(protectedRes.body).toHaveProperty('user')
    expect(protectedRes.body.user).toHaveProperty('username', 'admin')
  })
})
