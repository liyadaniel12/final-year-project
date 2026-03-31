import dotenv from 'dotenv'

dotenv.config()

import { getSupabaseAdmin } from './lib/supabaseAdmin.js'

console.log('Environment variables loaded:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

try {
  console.log('\n🔄 Testing Supabase connection...')
  const supabase = getSupabaseAdmin()
  console.log('✅ Supabase client created successfully')

  // Test basic connectivity
  console.log('🔄 Testing database connectivity...')
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })

  if (error) {
    console.log('❌ Database connection failed:', error.message)
    console.log('This might be because the "profiles" table doesn\'t exist yet.')
    console.log('You may need to create the table in your Supabase dashboard.')
  } else {
    console.log('✅ Database connection successful!')
    console.log(`Found ${data} profiles in the database`)
  }

  // Test auth functionality
  console.log('🔄 Testing auth functionality...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })

  if (authError) {
    console.log('❌ Auth test failed:', authError.message)
  } else {
    console.log('✅ Auth functionality working!')
    console.log(`Found ${authData.users.length} users in auth system`)
  }

} catch (err) {
  console.error('❌ Unexpected error:', err.message)
  process.exit(1)
}

console.log('\n🎉 Connection test completed!')