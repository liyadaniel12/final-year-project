
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuth() {
  console.log('Testing Supabase Auth getUser...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  // Test 1: Invalid token string
  console.log('\n--- Test 1: Random String ---');
  try {
    const { data, error } = await supabase.auth.getUser('this-is-not-a-jwt');
    if (error) {
      console.log('Error caught (expected):', error.message);
      console.log('Error status:', error.status);
    } else {
      console.log('Success? (Unexpected):', data);
    }
  } catch (err) {
    console.error('Fetch crashed:', err);
  }

  // Test 2: Expired or malformed JWT
  console.log('\n--- Test 2: Malformed JWT ---');
  try {
    const malformedJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid-signature';
    const { data, error } = await supabase.auth.getUser(malformedJwt);
    if (error) {
      console.log('Error caught:', error.message);
      console.log('Error status:', error.status);
    } else {
      console.log('Success? (Unexpected):', data);
    }
  } catch (err) {
    console.error('Fetch crashed:', err);
  }
}

testAuth();
