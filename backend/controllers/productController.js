import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

export const getProducts = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

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
  try {
    const supabase = getSupabaseAdmin()
    const { name, description, price, stock, category, unit } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([{ name, description, price, stock, category, unit: unit || 'unit' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Server error creating product:', error);
    res.status(500).json({ error: 'Server error creating product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params;
    const { name, description, price, stock, category, unit } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update({ name, description, price, stock, category, unit })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Server error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Server error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
};
