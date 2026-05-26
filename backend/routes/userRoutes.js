import express from 'express'
import { createUser, getUsers, updateUser, forgotPassword, verifyOTP, resetPassword } from '../controllers/userController.js'
import { authenticateAdmin, loginUser, changePassword } from '../middleware/auth.js'

const router = express.Router()

// Public routes (All roles can log in & change password on first login)
router.post('/login', loginUser)
router.put('/change-password', changePassword)

// Forgot Password Flow (Public)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)

// Protected routes (require admin authentication)
router.post('/', authenticateAdmin, createUser)
router.get('/', authenticateAdmin, getUsers)
router.put('/:id', authenticateAdmin, updateUser)

export default router