import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'
import nodemailer from 'nodemailer'

// Default password for new users
const DEFAULT_PASSWORD = '1234'

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

    // Note: No password strength validation here — admin can set any password.
    // Password rules are enforced on the user login / password change flow.

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
        full_name: full_name || null,
        role,
        status: status || 'active',
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

    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        branch_id,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get users error:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch users', details: error })
    }

    res.json({ users })
  } catch (err) {
    console.error('Server error in getUsers:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateUser = async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { role, branch_id, status, full_name } = req.body;

    const { error, data } = await supabaseAdmin
      .from('profiles')
      .update({ role, status, branch_id: branch_id || null, full_name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
       console.error('Update user error:', error);
       return res.status(500).json({ error: error.message });
    }

    // Sync relationship to branches table if assigned
    if (branch_id && role === 'branch_manager') {
       await supabaseAdmin.from('branches').update({ manager_id: id }).eq('id', branch_id);
    }

    res.json({ message: 'User updated successfully', user: data });
  } catch (err) {
    console.error('Server error in updateUser:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export const deleteUser = async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;

    // Prevent admins from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // 1. Check if user exists and get their info
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, branch_id')
      .eq('id', id)
      .single();

    if (fetchError || !profile) {
      console.error('User not found for deletion:', fetchError);
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. If the user is a branch_manager, clear the manager_id on their branch
    if (profile.role === 'branch_manager' && profile.branch_id) {
      await supabaseAdmin
        .from('branches')
        .update({ manager_id: null })
        .eq('id', profile.branch_id)
        .eq('manager_id', id);
    }

    // 3. Delete the profile row
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileDeleteError) {
      console.error('Profile deletion error:', profileDeleteError);
      return res.status(500).json({ error: 'Failed to delete user profile' });
    }

    // 4. Delete from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error('Auth user deletion error:', authDeleteError);
      // Profile is already deleted, log this but still respond with partial success
      return res.status(500).json({ error: 'Profile deleted but failed to remove auth account' });
    }

    console.log('User deleted successfully:', id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Server error in deleteUser:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// --- Forgot Password OTP Flow ---
const otpStore = new Map();

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();

    if (error || !profile) {
      return res.status(404).json({ error: 'This email address does not exist' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(email, { otp, expiresAt });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          family: 4,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset OTP - Branch Manager App',
          text: `Your password reset code is: ${otp}. It will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email} via Nodemailer`);
      } catch (mailErr) {
        console.error('Email sending failed, falling back to console OTP:', mailErr.message);
        console.log(`\n\n=== OTP FOR ${email} IS: ${otp} (email failed) ===\n\n`);
      }
    } else {
      console.log(`\n\n=== OTP FOR ${email} IS: ${otp} ===\n\n`);
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    const record = otpStore.get(email);
    if (!record || record.otp !== code || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'You have entered incorrect code' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Missing fields' });

    const record = otpStore.get(email);
    if (!record || record.otp !== code || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'You have entered incorrect code' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error: profileErr } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
    if (profileErr || !profile) return res.status(404).json({ error: 'User not found' });

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    otpStore.delete(email);
    res.json({ message: 'Your password changed. Now you can login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
