import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('transfers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Complete transfers deletion:', error || 'Success');
}

run();
