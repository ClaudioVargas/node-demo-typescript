import { Request, Response, NextFunction } from 'express'
import { Usuario } from '../models/usuario.model'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { addTokenToBlacklist } from '../validators/tokenBlacklist'
import { ApiError } from '../validators/apiError'

const SECRET = process.env.JWT_SECRET || 'secretKey'

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}$${derived}`
}



function verifyPassword(stored: string, attempted: string) {
  const [salt, derived] = stored.split("$");
  if (!salt || !derived) return false;

  const attemptedDerived = crypto
    .pbkdf2Sync(attempted, salt, 100000, 64, "sha512")
    .toString("hex");

  const derivedBuffer = Buffer.from(derived, "hex");
  const attemptedBuffer = Buffer.from(attemptedDerived, "hex");

  // Convertir a Uint8Array para que TypeScript esté conforme
  return crypto.timingSafeEqual(
    new Uint8Array(derivedBuffer),
    new Uint8Array(attemptedBuffer)
  );
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return next(new ApiError(400, 'name, email and password required'))

    // verificar existencia
    const found = await Usuario.findOne({ where: { email } })
    if (found) return next(new ApiError(409, 'Email already registered'))

    const pwd = hashPassword(password)
    const user = await Usuario.create({ name, email, password: pwd, isActive: true } as any)

    return res.status(201).json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return next(new ApiError(400, 'email and password required'))

    const user = await Usuario.findOne({ where: { email } })
    if (!user) return next(new ApiError(401, 'Invalid credentials'))

    const ok = verifyPassword((user as any).password, password)
    if (!ok) return next(new ApiError(401, 'Invalid credentials'))

    const payload = { id: user.id, email: user.email, name: user.name }
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })
    return res.json({ token })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) return next(new ApiError(400, 'No token provided'))
    const token = auth.split(' ')[1]

    // Decodificar para obtener tiempo de expiración
    const decoded: any = jwt.decode(token)
    const expSeconds = decoded && decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600
    addTokenToBlacklist(token, expSeconds)

    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }

  
}

export async function hashPasswordTest(req: Request, res: Response, next: NextFunction) {
  try {
    // const { password } = req.body || {}
    const password = "111111"
    const hash = hashPassword(password)
    return res.json({ ok: true, hash })
  } catch (err) {
    next(err)
  }

  
}
