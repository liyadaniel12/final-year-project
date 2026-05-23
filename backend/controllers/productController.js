import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

export const getProducts = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const activeOnly = req.query.active_only === 'true';

    let query = supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    // When active_only is requested, filter out Inactive products
    if (activeOnly) {
      query = query.or('status.eq.Active,status.is.null');
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ products });
  } catch (error) {
    console.error('Server error getting products:', error);
    res.status(500).json({ error: 'Server error retrieving products' });
  }
};

export const createProduct = async (req, res) => {
  // Deprecated: Only 4 fixed products are allowed.
  return res.status(403).json({ error: 'Creating new products is disabled. Shelf life is immutable and fixed.' });
};

export const updateProduct = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (status !== 'Active' && status !== 'Inactive') {
      return res.status(400).json({ error: 'Status must be Active or Inactive' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Product status updated successfully', product });
  } catch (error) {
    console.error('Server error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  // Deprecated: Only deactivation is allowed.
  return res.status(403).json({ error: 'Deleting products is disabled. You may only deactivate products.' });
};
