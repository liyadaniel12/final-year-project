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
    const { name, description, price, stock, category } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([{ name, description, price, stock, category }])
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
