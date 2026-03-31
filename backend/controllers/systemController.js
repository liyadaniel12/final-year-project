import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

export const getSystemOverview = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    
    // Fetch all profiles, branches, products
    const [profilesRes, branchesRes, productsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('branches').select('*').order('created_at', { ascending: true }),
      supabase.from('products').select('*')
    ]);

    const profiles = profilesRes.data || [];
    const branches = branchesRes.data || [];
    const products = productsRes.data || [];

    // Computations
    const totalUsers = profiles.length;
    const activeUsers = profiles.filter(p => (!p.status || p.status === 'active')).length;

    const totalBranches = branches.length;
    const activeBranches = branches.filter(b => (!b.status || b.status === 'active')).length;
    const inactiveBranches = branches.filter(b => b.status === 'inactive').length;

    const totalProducts = products.length;
    const productCategories = new Set(products.map(p => p.category).filter(Boolean)).size;

    const branchManagers = profiles.filter(p => p.role === 'branch_manager');
    const totalBranchManagers = branchManagers.length;
    const activeBranchManagers = branchManagers.filter(p => (!p.status || p.status === 'active')).length;

    // Users by Role
    const usersByRole = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    // Detailed Branch Map
    const branchStatusDetails = branches.map(b => {
      const manager = branchManagers.find(m => m.branch_id === b.id);
      return {
        id: b.id,
        name: b.name,
        managerName: manager?.full_name || manager?.email || 'Unassigned',
        status: b.status || 'active'
      };
    });

    res.json({
      totalUsers,
      activeUsers,
      totalBranches,
      activeBranches,
      inactiveBranches,
      totalProducts,
      productCategories,
      totalBranchManagers,
      activeBranchManagers,
      usersByRole,
      branchStatusDetails,
      // Pass the top user explicitly if it's the admin asking
      adminProfile: profiles.find(p => p.role === 'admin')
    });
  } catch (error) {
    console.error('Server error getting system overview:', error);
    res.status(500).json({ error: 'Server error retrieving system overview' });
  }
};
