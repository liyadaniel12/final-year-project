
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  (process.env.SUPABASE_URL || '').trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
);

async function testLookup() {
  console.log('Testing Batch Lookup Query...');
  try {
    // 1. Test simple select first
    console.log('\n--- Test 1: Simple select from branch_inventory ---');
    const { data: simpleData, error: simpleError } = await supabase
      .from('branch_inventory')
      .select('*')
      .limit(1);
      
    if (simpleError) {
      console.error('Error in simple select:', simpleError.message);
    } else {
      console.log('Success! Columns in branch_inventory:', Object.keys(simpleData[0] || {}));
    }

    // 2. Test the complex select with relationships
    console.log('\n--- Test 2: Complex select with relationships ---');
    const { data: complexData, error: complexError } = await supabase
      .from('branch_inventory')
      .select(`
        id, 
        stock, 
        expiry_date, 
        batch_number,
        product_id,
        products (
          id,
          name,
          category,
          unit,
          shelf_life_days
        ),
        branches (
          id,
          name
        )
      `)
      .limit(1);
      
    if (complexError) {
      console.error('Error in complex select:', complexError.message);
      console.error('Full Error Object:', JSON.stringify(complexError, null, 2));
    } else {
      console.log('Success in complex select!');
    }
  } catch (err) {
    console.error('Crashed:', err.message);
  }
}

testLookup();
