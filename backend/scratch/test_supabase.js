
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing Supabase connectivity...');
  console.log('URL:', process.env.SUPABASE_URL);
  try {
    const { data, error } = await supabase.from('profiles').select('count').single();
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Success! Data:', data);
    }
  } catch (err) {
    console.error('Fetch failed or other error:', err.message);
  }
}

test();
