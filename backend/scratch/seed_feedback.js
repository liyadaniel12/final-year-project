
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  (process.env.SUPABASE_URL || '').trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
);

async function seedFeedback() {
  console.log('Seeding demo feedback data...');
  
  try {
    // 1. Get some existing branches and products
    const { data: branches } = await supabase.from('branches').select('id, name');
    const { data: products } = await supabase.from('products').select('id, name');
    
    if (!branches || branches.length === 0) {
      console.error('No branches found. Please seed branches first.');
      return;
    }

    const demoFeedback = [
      {
        customer_name: 'John Smith',
        rating: 5,
        feedback_text: 'Excellent quality! The milk is very fresh and the packaging was perfect.',
        branch_id: branches[0].id,
        is_critical: false,
        is_resolved: true
      },
      {
        customer_name: 'Sarah Wilson',
        rating: 2,
        feedback_text: 'The yogurt I bought yesterday was near its expiry date. Please check your stock.',
        branch_id: branches[0].id,
        is_critical: true,
        is_resolved: false
      },
      {
        customer_name: 'David Brown',
        rating: 4,
        feedback_text: 'Great service at the branch, but the selection of cheese was a bit limited today.',
        branch_id: branches[0].id,
        is_critical: false,
        is_resolved: false
      }
    ];

    console.log('Inserting demo feedback...');
    const { data, error } = await supabase
      .from('customer_feedbacks')
      .insert(demoFeedback)
      .select();

    if (error) {
      if (error.message.includes('relation "customer_feedbacks" does not exist')) {
        console.error('ERROR: The table "customer_feedbacks" does not exist in your Supabase database.');
        console.error('Please run the SQL script in backend/database/create_customer_feedbacks.sql in your Supabase SQL Editor.');
      } else {
        console.error('Error seeding feedback:', error.message);
      }
    } else {
      console.log('Successfully seeded', data.length, 'feedback records!');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

seedFeedback();
