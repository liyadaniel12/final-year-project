import express from 'express'
import { createUser, getUsers, updateUser } from '../controllers/userController.js'
import { authenticateAdmin, loginUser, changePassword } from '../middleware/auth.js'

const router = express.Router()

// Public routes (All roles can log in & change password on first login)
router.post('/login', loginUser)
router.put('/change-password', changePassword)

// Protected routes (require admin authentication)
router.post('/', authenticateAdmin, createUser)
router.get('/', authenticateAdmin, getUsers)
router.put('/:id', authenticateAdmin, updateUser)

export default router