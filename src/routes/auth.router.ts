import { Router } from 'express'
import { signup, login, logout, hashPasswordTest } from '../controllers/auth.controller'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.get('/hashPassword/:password', hashPasswordTest)

export default router
