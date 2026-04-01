import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

export const getManagerStock = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const [branchesRes, productsRes, inventoryRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('products').select('*'),
      supabase.from('branch_inventory').select('*')
    ]);

    const branches = branchesRes.data || [];
    const products = productsRes.data || [];
    const inventory = inventoryRes.data || [];

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const stockList = inventory.map(item => {
      const branch = branches.find(b => b.id === item.branch_id);
      const product = products.find(p => p.id === item.product_id);
      const expiryDate = new Date(item.expiry_date);
      
      let status = 'Fresh';
      let daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (expiryDate < now) {
        status = 'Expired';
        daysLeft = -1;
      } else if (expiryDate <= thirtyDaysFromNow) {
        status = 'Near Expiry';
      }

      return {
        id: item.id,
        branch: branch?.name || 'Unknown Branch',
        product: product?.name || 'Unknown Product',
        batch: item.id.substring(0, 12).toUpperCase(),
        qty: `${item.stock} ${product?.unit || 'units'}`,
        expiry: item.expiry_date,
        daysLeft: daysLeft < 0 ? '—' : daysLeft.toString(),
        status
      };
    });

    res.json({ stock: stockList });
  } catch (error) {
    console.error('Error fetching manager stock:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getManagerSales = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const [salesRes, branchesRes, productsRes, profilesRes] = await Promise.all([
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('branches').select('*'),
      supabase.from('products').select('*'),
      supabase.from('profiles').select('id, full_name, email')
    ]);

    if (salesRes.error) {
       console.error('Sales table missing or error:', salesRes.error.message);
       return res.json({ sales: [] }); // return empty gracefully if table not created yet
    }

    const sales = salesRes.data || [];
    const branches = branchesRes.data || [];
    const products = productsRes.data || [];
    const profiles = profilesRes.data || [];

    const salesList = sales.map(item => {
      const branch = branches.find(b => b.id === item.branch_id);
      const product = products.find(p => p.id === item.product_id);
      const profile = profiles.find(p => p.id === item.recorded_by);
      const dateObj = new Date(item.created_at);

      return {
        id: item.id,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        branch: branch?.name || 'Unknown',
        product: product?.name || 'Unknown',
        batch: item.batch_id ? item.batch_id.substring(0, 12).toUpperCase() : 'N/A',
        sold: `${item.quantity} ${product?.unit || 'units'}`,
        remaining: 'N/A',
        recordedBy: profile?.full_name || profile?.email || 'Unknown Manager'
      };
    });

    res.json({ sales: salesList });
  } catch (error) {
    console.error('Error fetching manager sales:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getManagerTransfers = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const [transfersRes, branchesRes, productsRes] = await Promise.all([
      supabase.from('transfers').select('*').order('created_at', { ascending: false }),
      supabase.from('branches').select('*'),
      supabase.from('products').select('*')
    ]);

    if (transfersRes.error) {
       console.error('Transfers table missing or error:', transfersRes.error.message);
       return res.json({ transfers: [] }); 
    }

    const transfers = transfersRes.data || [];
    const branches = branchesRes.data || [];
    const products = productsRes.data || [];

    const transfersList = transfers.map(item => {
      const fromBranch = branches.find(b => b.id === item.from_branch_id);
      const toBranch = branches.find(b => b.id === item.to_branch_id);
      const product = products.find(p => p.id === item.product_id);

      return {
        id: item.id,
        from: fromBranch?.name || 'Unknown',
        to: toBranch?.name || 'Unknown',
        product: product?.name || 'Unknown',
        batch: item.batch_id ? item.batch_id.substring(0, 12).toUpperCase() : 'N/A',
        qty: `${item.quantity} ${product?.unit || 'units'}`,
        status: item.status
      };
    });

    res.json({ transfers: transfersList });
  } catch (error) {
    console.error('Error fetching manager transfers:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
