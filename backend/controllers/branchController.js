import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

export const getBranches = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching branches:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ branches });
  } catch (error) {
    console.error('Server error getting branches:', error);
    res.status(500).json({ error: 'Server error retrieving branches' });
  }
};

export const createBranch = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { name, location, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const { data: branch, error } = await supabase
      .from('branches')
      .insert([{ name, location, status: status || 'active' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating branch:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Branch created successfully', branch });
  } catch (error) {
    console.error('Server error creating branch:', error);
    res.status(500).json({ error: 'Server error creating branch' });
  }
};
