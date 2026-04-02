import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export const lookupBatch = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { batchNumber } = req.query;

    if (!batchNumber) {
      return res.status(400).json({ error: 'Batch number is required' });
    }

    // Lookup the inventory item by batch_number
    const { data: inventoryItem, error } = await supabase
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
      .eq('batch_number', batchNumber)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Database error on lookup:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!inventoryItem) {
      return res.json({ exists: false, message: 'Batch number not found' });
    }

    // Compute days left and status
    const expiryDate = new Date(inventoryItem.expiry_date);
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Days remaining

    let status = 'fresh';
    if (daysLeft < 0) {
      status = 'expired';
    } else if (daysLeft <= 7) {
      status = 'near_expiry';
    }

    // Format response to match the frontend expectations
    const batchData = {
      id: inventoryItem.id,
      batchNumber: inventoryItem.batch_number,
      productId: inventoryItem.product_id,
      productName: inventoryItem.products?.name,
      productCategory: inventoryItem.products?.category,
      quantity: inventoryItem.stock,
      unit: inventoryItem.products?.unit || 'unit',
      expiryDate: inventoryItem.expiry_date,
      // Since `production_date` isn't in branch_inventory, we'll estimate or just provide what we have.
      productionDate: new Date(expiryDate.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString(), 
      daysLeft,
      status,
      branchId: inventoryItem.branches?.id,
      branchName: inventoryItem.branches?.name,
      isActive: true, // simplified
    };

    return res.json({
      exists: true,
      batch: batchData,
    });
  } catch (error) {
    console.error('Server error looking up batch:', error);
    res.status(500).json({ error: 'Server error looking up batch' });
  }
};
