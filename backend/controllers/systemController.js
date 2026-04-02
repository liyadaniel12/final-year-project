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

export const getManagerDashboard = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    
    // Fetch user profile to get manager details
    const userId = req.user.id;
    const { data: managerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching manager profile:', profileError);
    }
    
    // Fetch all required data for dashboard
    const [branchesRes, productsRes, inventoryRes, branchManagersRes, criticalFeedbacksRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('products').select('*'),
      supabase.from('branch_inventory').select('*'),
      supabase.from('profiles').select('id, full_name, email, branch_id').eq('role', 'branch_manager'),
      supabase.from('customer_feedbacks').select('*').eq('is_critical', true)
    ]);

    const branches = branchesRes.data || [];
    const products = productsRes.data || [];
    const inventory = inventoryRes.data || [];
    const branchManagers = branchManagersRes.data || [];
    const criticalFeedbacks = criticalFeedbacksRes.data || [];

    // Helper functions for dates
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Compute KPIs
    const totalStockBatches = inventory.length;
    let nearExpiryItems = 0;
    let expiredItems = 0;
    const criticalAlerts = [];

    // Compute Branch Performance
    const branchPerformanceMap = {};
    branches.forEach(b => {
      const manager = branchManagers.find(m => m.branch_id === b.id);
      branchPerformanceMap[b.id] = {
        id: b.id,
        branch: b.name,
        manager: manager?.full_name || manager?.email || 'Unassigned',
        batches: 0,
        near: 0,
        expired: 0,
        fresh: '100%',
        risk: 'Low'
      };
    });

    inventory.forEach(item => {
      const bPerf = branchPerformanceMap[item.branch_id];
      if (bPerf) bPerf.batches += 1;

      if (!item.expiry_date) return;
      
      const expiryDate = new Date(item.expiry_date);
      const product = products.find(p => p.id === item.product_id);
      const branch = branches.find(b => b.id === item.branch_id);
      
      // Calculate days difference
      const timeDiff = expiryDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (expiryDate < now) {
        expiredItems++;
        if (bPerf) bPerf.expired += 1;
        
        // Critical alert: Expired
        criticalAlerts.push({
          id: `crit-exp-${item.id}`,
          type: 'expired',
          batch: item.id.substring(0, 12),
          productName: product ? `${product.name} ${product.unit}` : 'Unknown Product',
          branchName: branch ? branch.name : 'Unknown Branch'
        });
        
      } else if (expiryDate <= thirtyDaysFromNow) {
        // Technically "near expiry" is <= 30 days overall
        nearExpiryItems++;
        if (bPerf) bPerf.near += 1;
        
        // Critical alert: Near Expiry (only those <= 7 days)
        if (daysDiff <= 7) {
          criticalAlerts.push({
            id: `crit-near-${item.id}`,
            type: 'near',
            batch: item.id.substring(0, 12),
            productName: product ? `${product.name} ${product.unit}` : 'Unknown Product',
            branchName: branch ? branch.name : 'Unknown Branch',
            days: daysDiff > 0 ? daysDiff : 0
          });
        }
      }
    });

    criticalFeedbacks.forEach(cf => {
      // For branch name, we might just have the text literal 'Main Branch' from dropdown instead of a UUID if the user stores the text directly.
      const branchObj = branches.find(b => b.id === cf.branch_id);
      const branchName = branchObj ? branchObj.name : cf.branch_id; // Handles text like 'Main Branch'
      criticalAlerts.push({
        id: `crit-feedback-${cf.id}`,
        type: 'customer_feedback',
        batch: cf.batch_number || 'Unknown',
        branchName: branchName || 'Unknown Branch',
        message: cf.feedback_text || 'Urgent Customer Report',
        date: cf.created_at
      });
    });

    // Finalize Branch Performance formats
    const branchPerformance = Object.values(branchPerformanceMap).map(b => {
      let freshPercent = 100;
      if (b.batches > 0) {
        const freshBatches = b.batches - b.near - b.expired;
        freshPercent = Math.round((Math.max(freshBatches, 0) / b.batches) * 100);
      }
      
      let risk = 'Low';
      if (b.expired > 0 || freshPercent < 70) risk = 'High';
      else if (b.near > 10 || freshPercent < 90) risk = 'Medium';

      return {
        ...b,
        fresh: `${freshPercent}%`,
        risk
      };
    });

    // Sort critical alerts (customer feedback first, then expired, then near expiry by days)
    criticalAlerts.sort((a, b) => {
      if (a.type === 'customer_feedback' && b.type !== 'customer_feedback') return -1;
      if (b.type === 'customer_feedback' && a.type !== 'customer_feedback') return 1;
      if (a.type === 'expired' && b.type !== 'expired') return -1;
      if (b.type === 'expired' && a.type !== 'expired') return 1;
      if (a.type === 'near' && b.type === 'near') return a.days - b.days;
      return 0;
    });

    // Limit to top 10 alerts
    const topAlerts = criticalAlerts.slice(0, 10);

    res.json({
      managerInfo: {
        name: managerProfile?.full_name || managerProfile?.email || 'Manager',
        role: managerProfile?.role === 'main_manager' ? 'Main Manager' : 'Admin'
      },
      kpis: {
        totalStockBatches,
        nearExpiryItems,
        expiredItems,
        monthlySalesTxns: 0 // Placeholder
      },
      activeTransfers: 0, // Placeholder
      criticalAlerts: topAlerts,
      branchPerformance
    });
    
  } catch (error) {
    console.error('Server error getting manager dashboard:', error);
    res.status(500).json({ error: 'Server error retrieving manager dashboard' });
  }
};
