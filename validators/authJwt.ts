import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ApiError } from './apiError'

const SECRET = process.env.JWT_SECRET || 'secretKey'

export interface JwtRequest extends Request {
  user?: any
}

export function authJwt(req: JwtRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'))
  }
  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, SECRET)
    req.user = payload
    next()
  } catch (err) {
    return next(new ApiError(401, 'Invalid token'))
  }
}
