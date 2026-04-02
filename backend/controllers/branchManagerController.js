import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

const resolveBranchId = async (req) => {
  if (req.query.branch_id) return req.query.branch_id;
  if (req.user.branch_id) return req.user.branch_id;
  
  if (req.user.role === 'admin' || req.user.role === 'main_manager') {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('branches').select('id').limit(1).single();
    return data?.id || null;
  }
  return null;
};

export const getBranchDashboard = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required or no branches exist' });

    const supabase = getSupabaseAdmin();

    const [branchRes, inventoryRes, productsRes] = await Promise.all([
      supabase.from('branches').select('*').eq('id', branchId).single(),
      supabase.from('branch_inventory').select('*').eq('branch_id', branchId),
      supabase.from('products').select('*')
    ]);

    const branch = branchRes.data;
    const inventory = inventoryRes.data || [];
    const products = productsRes.data || [];

    const now = new Date();
    let expiredCount = 0;
    let nearCount = 0;
    let freshCount = 0;
    const criticalAlerts = [];

    inventory.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      const expiryDate = new Date(item.expiry_date);
      const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (daysDiff < 0) {
        expiredCount++;
        criticalAlerts.push({
          id: item.id,
          type: 'Expired',
          product: product?.name || 'Unknown',
          batch: item.id.substring(0, 12).toUpperCase(),
          days: 'Expired',
          qty: `${item.stock} ${product?.unit || ''}`
        });
      } else if (daysDiff <= 7) {
        nearCount++;
        criticalAlerts.push({
          id: item.id,
          type: 'Near Expiry',
          product: product?.name || 'Unknown',
          batch: item.id.substring(0, 12).toUpperCase(),
          days: `${daysDiff} days`,
          qty: `${item.stock} ${product?.unit || ''}`
        });
      } else {
        freshCount++;
      }
    });

    res.json({
      branchName: branch?.name || 'Unknown Branch',
      totalBatches: inventory.length,
      freshCount,
      nearCount,
      expiredCount,
      criticalAlerts: criticalAlerts.slice(0, 5)
    });

  } catch (error) {
    console.error('Branch Dashboard Error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getBranchStock = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const supabase = getSupabaseAdmin();
    const [invRes, prodRes] = await Promise.all([
      supabase.from('branch_inventory').select('*').eq('branch_id', branchId),
      supabase.from('products').select('*')
    ]);

    const inventory = invRes.data || [];
    const products = prodRes.data || [];
    const now = new Date();

    const stock = inventory.map(item => {
      const product = products.find(p => p.id === item.product_id);
      const expiry = new Date(item.expiry_date);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      let status = 'Fresh';
      if (daysLeft < 0) status = 'Expired';
      else if (daysLeft <= 7) status = 'Near Expiry';

      return {
        id: item.id,
        product: product?.name || 'Unknown',
        product_id: item.product_id,
        batch: item.batch_number || item.id.substring(0, 12).toUpperCase(),
        qty: item.stock,
        unit: product?.unit || '',
        formattedQty: `${item.stock} ${product?.unit || ''}`,
        rawExpiry: item.expiry_date,
        daysLeft: daysLeft < 0 ? '—' : `${daysLeft}d left`,
        status
      };
    });

    res.json({ stock: stock.sort((a, b) => new Date(a.rawExpiry) - new Date(b.rawExpiry)) });
  } catch (error) {
    console.error('Branch Stock Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addBranchStock = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const { product_id, quantity, batch_number } = req.body;
    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseAdmin();

    const { data: productData, error: prodErr } = await supabase.from('products').select('shelf_life_days').eq('id', product_id).single();
    if (prodErr || !productData) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const shelfLifeDays = productData.shelf_life_days || 14; 
    const computedExpiryDate = new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase.from('branch_inventory').insert([{
      branch_id: branchId,
      product_id,
      stock: quantity,
      expiry_date: computedExpiryDate,
      batch_number: batch_number || null
    }]).select().single();

    if (error) throw error;
    res.json({ message: 'Stock added successfully', batch: data });
  } catch (error) {
    console.error('Add Stock Error:', error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
};

export const getBranchSales = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const supabase = getSupabaseAdmin();
    const [salesRes, prodRes] = await Promise.all([
      supabase.from('sales').select('*').eq('branch_id', branchId).order('created_at', { ascending: false }),
      supabase.from('products').select('*')
    ]);

    const salesList = (salesRes.data || []).map(item => {
      const product = (prodRes.data || []).find(p => p.id === item.product_id);
      const dateObj = new Date(item.created_at);
      
      // Since item.batch_id links to branch_inventory UUID, let's just show it safely
      // In a strict production system, we'd join branch_inventory fully to get the string, 
      // but rendering the custom string or truncating UUID is fine.
      return {
        id: item.id,
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString(),
        product: product?.name || 'Unknown',
        batch: item.batch_id ? item.batch_id.substring(0, 12).toUpperCase() : 'N/A',
        sold: item.quantity,
        formattedSold: `${item.quantity} ${product?.unit || ''}`
      };
    });

    res.json({ sales: salesList });
  } catch (error) {
    console.error('Branch Sales Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Extremely critical transactional endpoint
export const recordBranchSale = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const { batch_id, quantity } = req.body;
    if (!batch_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid batch_id and quantity required' });
    }

    const supabase = getSupabaseAdmin();
    
    // 1. Fetch current stock
    const { data: invItem, error: invError } = await supabase
      .from('branch_inventory')
      .select('*')
      .eq('id', batch_id)
      .eq('branch_id', branchId)
      .single();

    if (invError || !invItem) return res.status(404).json({ error: 'Batch not found in your branch' });
    if (invItem.stock < quantity) return res.status(400).json({ error: 'Not enough stock in this batch' });

    const newStock = Number(invItem.stock) - Number(quantity);

    // 2. Decrement stock
    const { error: updError } = await supabase
      .from('branch_inventory')
      .update({ stock: newStock })
      .eq('id', batch_id);

    if (updError) throw updError;

    // 3. Log sale
    const { error: saleError } = await supabase.from('sales').insert([{
      branch_id: branchId,
      product_id: invItem.product_id,
      batch_id: batch_id,
      quantity: quantity,
      recorded_by: req.user.id
    }]);

    if (saleError) console.error('Warning: Failed to log sale into sales table', saleError);

    res.json({ message: 'Sale recorded! Inventory updated.', remainingStock: newStock });
  } catch (error) {
    console.error('Record Sale Error:', error);
    res.status(500).json({ error: 'Server error recording sale' });
  }
};

export const getBranchTransfers = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const supabase = getSupabaseAdmin();
    const [transfersRes, prodRes, branchRes] = await Promise.all([
      supabase.from('transfers').select('*').or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`),
      supabase.from('products').select('*'),
      supabase.from('branches').select('*')
    ]);

    const transfersList = (transfersRes.data || []).map(item => {
      const fromBranch = (branchRes.data || []).find(b => b.id === item.from_branch_id);
      const toBranch = (branchRes.data || []).find(b => b.id === item.to_branch_id);
      const product = (prodRes.data || []).find(p => p.id === item.product_id);

      return {
        id: item.id,
        direction: item.from_branch_id === branchId ? 'Outbound' : 'Inbound',
        from: fromBranch?.name || 'Unknown',
        to: toBranch?.name || 'Unknown',
        product: product?.name || 'Unknown',
        batch: item.batch_id ? item.batch_id.substring(0, 12).toUpperCase() : 'N/A',
        qty: item.quantity,
        formattedQty: `${item.quantity} ${product?.unit || ''}`,
        status: item.status
      };
    });

    res.json({ transfers: transfersList.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) });
  } catch (error) {
    console.error('Branch Transfers Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createBranchTransfer = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    let { from_branch_id, to_branch_id, product_id, batch_id, quantity } = req.body;
    
    if (!to_branch_id) to_branch_id = branchId;
    if (!from_branch_id) from_branch_id = branchId;

    if (!from_branch_id || !to_branch_id || !product_id || !quantity) {
      return res.status(400).json({ error: 'Missing required transfer details' });
    }

    // Must involve current branch
    if (from_branch_id !== branchId && to_branch_id !== branchId) {
      return res.status(403).json({ error: 'You can only create transfers involving your own branch' });
    }

    const supabase = getSupabaseAdmin();
    
    // Validate we have enough stock if sending out
    if (batch_id && from_branch_id === branchId) {
       const { data: stockItem } = await supabase.from('branch_inventory').select('stock').eq('id', batch_id).single();
       if (!stockItem || stockItem.stock < quantity) {
           return res.status(400).json({ error: 'Insufficient stock in this batch to transfer' });
       }
    }

    const { data, error } = await supabase.from('transfers').insert([{
      from_branch_id,
      to_branch_id,
      product_id,
      batch_id,
      quantity,
      status: 'Pending'
    }]).select();

    if (error) throw error;
    res.json({ message: 'Transfer request created successfully', data });
  } catch(error) {
    console.error('Create Transfer Error:', error);
    res.status(500).json({ error: 'Failed to create transfer request' });
  }
};

export const updateBranchTransfer = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const { id } = req.params;
    const { status } = req.body; // e.g. Accepted, Rejected, Completed

    const supabase = getSupabaseAdmin();
    
    // First, verify the transfer exists and we are the RECIPIENT (or sender depending on rule)
    const { data: transfer, error: fetchErr } = await supabase.from('transfers').select('*').eq('id', id).single();
    if (fetchErr || !transfer) return res.status(404).json({ error: 'Transfer not found' });

    // Only allow updating if it's involved with this branch
    if (transfer.to_branch_id !== branchId && transfer.from_branch_id !== branchId) {
      return res.status(403).json({ error: 'Unauthorized to process this transfer' });
    }

    // IF STATUS COMPLETED -> Move Stock
    if (status === 'Completed' && transfer.status !== 'Completed') {
      // 1. Subtract from from_branch
      // If batch_id is set, pull from there. Else, what batch? 
      // A request might not specify a batch_id initially. If it's not set, we just pick the first available or fail.
      // For simplicity, we require the sender to assign a batch_id when Accepting, or we just deduct it arbitrarily.
      // But if there's no batch_id, we can't easily move stock in this schema without it. Let's assume sender deducts properly.
      let senderBatchId = transfer.batch_id;
      let senderStock = 0;

      if (!senderBatchId) {
         // Auto-resolve batch from sender
         const { data: batches } = await supabase.from('branch_inventory').select('*').eq('branch_id', transfer.from_branch_id).eq('product_id', transfer.product_id).gt('stock', 0);
         if (batches && batches.length > 0) {
           senderBatchId = batches[0].id;
           senderStock = batches[0].stock;
         } else {
           return res.status(400).json({ error: 'Sender does not have sufficient stock to complete this transfer.' });
         }
      } else {
         const { data: batchData } = await supabase.from('branch_inventory').select('stock').eq('id', senderBatchId).single();
         if (batchData) senderStock = batchData.stock;
      }

      if (senderStock < transfer.quantity) {
        return res.status(400).json({ error: 'Not enough stock in the sender batch to complete this transfer' });
      }

      // Deduct from sender
      const { error: updErr1 } = await supabase.from('branch_inventory').update({ stock: Number(senderStock) - Number(transfer.quantity) }).eq('id', senderBatchId);
      if (updErr1) throw updErr1;

      // 2. Add to recipient (create new inventory row since batch implies arrival time)
      const { data: senderBatchFull } = await supabase.from('branch_inventory').select('expiry_date').eq('id', senderBatchId).single();
      
      const { error: updErr2 } = await supabase.from('branch_inventory').insert([{
        branch_id: transfer.to_branch_id,
        product_id: transfer.product_id,
        stock: transfer.quantity,
        expiry_date: senderBatchFull?.expiry_date || new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }]);
      if (updErr2) throw updErr2;
    }

    const { data, error } = await supabase.from('transfers').update({ status }).eq('id', id).select();

    if (error) throw error;
    res.json({ message: `Transfer marked as ${status}`, data });
  } catch(error) {
    console.error('Update Transfer Error:', error);
    res.status(500).json({ error: 'Failed to update transfer status' });
  }
};

export const getTransferOptions = async (req, res) => {
  try {
    const branchId = await resolveBranchId(req);
    const { product_id } = req.query;
    
    const supabase = getSupabaseAdmin();
    
    // Base data
    const [prodRes, branchRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('branches').select('*')
    ]);

    const result = {
      products: prodRes.data || [],
      recommendations: []
    };

    if (product_id) {
       const branches = branchRes.data || [];
       
       const { data: invData } = await supabase.from('branch_inventory')
                                               .select('branch_id, stock')
                                               .eq('product_id', product_id);
       
       const branchStockMap = {};
       (invData || []).forEach(item => {
         if (!branchStockMap[item.branch_id]) branchStockMap[item.branch_id] = 0;
         branchStockMap[item.branch_id] += Number(item.stock);
       });

       const recs = branches
         .filter(b => b.id !== branchId)
         .map(b => ({
           branch_id: b.id,
           branch_name: b.name,
           available_stock: branchStockMap[b.id] || 0
         }))
         .sort((a,b) => a.available_stock - b.available_stock); // Lowest stock first

       result.recommendations = recs;
    }

    res.json(result);
  } catch (error) {
    console.error('Transfer Options Error:', error);
    res.status(500).json({ error: 'Failed to load transfer options' });
  }
};
