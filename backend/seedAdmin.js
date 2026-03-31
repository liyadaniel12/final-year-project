import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAdmin() {
  console.log('Checking for existing admin user...');
  
  // 1. Check if user exists in auth.users
  const { data: { users }, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (checkError) {
    console.error('Error fetching users:', checkError.message);
    return;
  }

  const existingAdmin = users.find(u => u.email === 'admin@example.com');
  
  let userId;

  if (existingAdmin) {
    console.log('Admin user already exists in auth.users:', existingAdmin.id);
    userId = existingAdmin.id;
  } else {
    // 2. Create user with bcrypt hash managed internally by Supabase Auth
    console.log('Creating admin user in auth.users...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'admin123', // Supabase will automatically bcrypt this
      email_confirm: true   // Bypass email confirmation
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    
    console.log('Admin user created successfully:', newUser.user.id);
    userId = newUser.user.id;
  }

  // 3. Ensure profile and role exist in the "profiles" table
  console.log('Ensuring profile role is set to "admin"...');
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ 
      id: userId, 
      email: 'admin@example.com', 
      role: 'admin',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    console.error('Error upserting into profiles table:', profileError.message);
  } else {
    console.log('Admin profile configured successfully:', profile);
    console.log('\nYou can now log in with email: admin@example.com and password: admin123');
  }
}

seedAdmin();
