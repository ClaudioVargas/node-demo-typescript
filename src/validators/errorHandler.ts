import { Request, Response, NextFunction } from 'express'
import { ApiError } from './apiError'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details })
  }

  console.error(err)
  return res.status(500).json({ error: 'Internal Server Error' })
}
