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

    // Fetch branch managers to attach to branches
    const { data: managers, error: managersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, branch_id')
      .eq('role', 'branch_manager');

    if (managersError) {
       console.error('Error fetching managers:', managersError);
    }

    // Fetch real stats from branch_inventory
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('branch_inventory')
      .select('branch_id, product_id, stock, expiry_date');

    if (inventoryError) {
      console.error('Error fetching branch inventory:', inventoryError);
    } // proceed even if error to still return branches

    // Compute stats
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Attach manager and real stats to each branch
    const branchesWithStats = branches.map(b => {
      const manager = managers?.find(m => m.branch_id === b.id);
      
      const branchItems = inventoryData?.filter(inv => inv.branch_id === b.id) || [];
      const totalStock = branchItems.reduce((sum, item) => sum + (item.stock || 0), 0);
      
      const uniqueProducts = new Set(branchItems.map(item => item.product_id));
      const productTypes = uniqueProducts.size;

      let expired = 0;
      let nearExpiry = 0;

      branchItems.forEach(item => {
        if (!item.expiry_date) return;
        const expiryDate = new Date(item.expiry_date);
        if (expiryDate < now) {
          expired++;
        } else if (expiryDate <= thirtyDaysFromNow) {
          nearExpiry++;
        }
      });

      return {
        ...b,
        managerName: manager?.full_name || manager?.email || 'Unassigned',
        managerId: manager?.id || null,
        totalStock,
        productTypes,
        nearExpiry,
        expired
      };
    });

    res.json({ branches: branchesWithStats });
  } catch (error) {
    console.error('Server error getting branches:', error);
    res.status(500).json({ error: 'Server error retrieving branches' });
  }
};

export const createBranch = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const { data: branch, error } = await supabase
      .from('branches')
      .insert([{ name, location }])
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

export const updateBranch = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params;
    const { name, location } = req.body;

    const { data: branch, error } = await supabase
      .from('branches')
      .update({ name, location })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating branch:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Branch updated successfully', branch });
  } catch (error) {
    console.error('Server error updating branch:', error);
    res.status(500).json({ error: 'Server error updating branch' });
  }
};

