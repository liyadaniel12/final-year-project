import dotenv from 'dotenv'

dotenv.config()

import express from 'express'
import cors from 'cors'
import userRoutes from './routes/userRoutes.js'
import branchRoutes from './routes/branchRoutes.js'
import productRoutes from './routes/productRoutes.js'
import systemRoutes from './routes/systemRoutes.js'
import managerRoutes from './routes/managerRoutes.js'
import branchManagerRoutes from './routes/branchManagerRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Routes
app.use('/api/users', userRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/products', productRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/manager', managerRoutes)
app.use('/api/branch-manager', branchManagerRoutes)

const PORT = process.env.PORT || 9000

console.log('Starting server...')
console.log('PORT:', PORT)

const server = app.listen(PORT, () => {
  console.log(`✅ Server successfully started on port ${PORT}`)
  console.log(`Health check available at http://localhost:${PORT}/health`)
  console.log(`API endpoints available at http://localhost:${PORT}/api/users`)
})

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err)
  server.close(() => {
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  server.close(() => {
    process.exit(1)
  })
})