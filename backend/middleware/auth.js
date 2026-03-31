import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Simple JWT implementation without external dependencies
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64').toString()
}

function createJWT(payload, secret, expiresIn = '24h') {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const exp = expiresIn === '24h' ? now + 86400 : now + 3600 // Default 24h or 1h

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: exp
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload))

  const data = `${encodedHeader}.${encodedPayload}`
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(data).digest('base64')
  )

  return `${data}.${signature}`
}

function verifyJWT(token, secret) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid token')

    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))

    if (header.alg !== 'HS256') throw new Error('Unsupported algorithm')

    const data = `${parts[0]}.${parts[1]}`
    const expectedSignature = base64UrlEncode(
      crypto.createHmac('sha256', secret).update(data).digest('base64')
    )

    if (expectedSignature !== parts[2]) throw new Error('Invalid signature')

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired')
    }

    return payload
  } catch (err) {
    throw new Error('Invalid token')
  }
}

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token using Supabase directly 
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const userId = userData.user.id

    // Check if user exists and is admin
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.user = { id: userId, role: profile.role }
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Create a temporary client just for login verification to prevent mutating the global admin client
    // Supabase signInWithPassword modifies the client's session, which would break global admin privileges
    const loginClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    // Sign in with Supabase Auth
    const { data, error } = await loginClient.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Login error:', error)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if the user is required to change their password
    if (data.user.user_metadata?.must_change_password) {
      return res.status(403).json({
        error: 'Password change required before login',
        requiresPasswordChange: true,
        email: data.user.email
      })
    }

    // Use the global admin client to bypass RLS when fetching the profile
    const supabaseAdmin = getSupabaseAdmin()

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' })
    }

    // Generate JWT token
    const token = createJWT(
      { userId: data.user.id, email: data.user.email, role: profile.role },
      JWT_SECRET
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role
      }
    })
  } catch (err) {
    console.error('Login server error:', err)
    res.status(500).json({ error: 'Server error', details: err.message, stack: err.stack })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, currentPassword, and newPassword are required' })
    }

    // 1. Authenticate the user to verify their current password
    const loginClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: authData, error: authError } = await loginClient.auth.signInWithPassword({
      email,
      password: currentPassword
    })

    if (authError) {
      return res.status(401).json({ error: 'Invalid current password' })
    }

    // 2. Safely overwrite the password and flip the flag using the robust Admin API
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      {
        password: newPassword,
        user_metadata: { must_change_password: false }
      }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return res.status(400).json({ error: updateError.message })
    }

    res.json({ message: 'Password updated successfully. You can now log in.' })

  } catch (err) {
    console.error('Change password server error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}