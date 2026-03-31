import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

// Default password for new users
const DEFAULT_PASSWORD = 'TempPass123!'

const VALID_ROLES = ['main_manager', 'branch_manager', 'admin']

export const createUser = async (req, res) => {
  try {
    console.log('Creating user with data:', { email: req.body.email, role: req.body.role, createdBy: req.user.id })

    const { email, role, branch_id, password, full_name, status } = req.body

    const assignedPassword = password || DEFAULT_PASSWORD

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' })
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      })
    }

    // Only admins can create other admins
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create admin accounts' })
    }

    const supabaseAdmin = getSupabaseAdmin()
    console.log('Supabase client obtained successfully')

    // Supabase Auth will automatically reject duplicates, 
    // so we don't need to manually check if the user exists beforehand.

    // 1. Create user in Supabase Auth with assigned password
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: assignedPassword,
      email_confirm: true,
      user_metadata: {
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        must_change_password: true
      }
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return res.status(400).json({ error: error.message })
    }

    console.log('User created in auth:', data.user.id)

    // 2. Create/Update profile record
    // We use upsert because the Supabase DB might have an auth trigger that automatically creates the profile row.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        role,
        branch_id: branch_id || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      return res.status(500).json({ error: 'Failed to create user profile' })
    }

    console.log('Profile created successfully')

    res.json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name,
        status,
        role,
        branch_id,
        assignedPassword
      },
      note: 'Please inform the user to change their password after first login'
    })
  } catch (err) {
    console.error('Server error in createUser:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getUsers = async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        role,
        branch_id,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get users error:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch users', details: error })
    }

    res.json({ users: data })
  } catch (err) {
    console.error('Server error in getUsers:', err)
    res.status(500).json({ error: 'Server error' })
  }
}