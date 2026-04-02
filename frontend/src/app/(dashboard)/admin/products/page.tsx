'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabaseClient';
import { Edit2, Trash2, Tag, Box, Info } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function ProductManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', unit: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:9000/api/products', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const CATEGORY_STYLES: Record<string, string> = {
    'Milk': 'bg-blue-50 text-blue-700 border-blue-200',
    'Yogurt': 'bg-pink-50 text-pink-700 border-pink-200',
    'Cheese': 'bg-amber-50 text-amber-700 border-amber-200',
    'Butter': 'bg-yellow-50 text-yellow-700 border-yellow-200'
  };

  const getCategoryBadge = (category: string) => {
    // Normalize to sentence case for matching if needed
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const classes = CATEGORY_STYLES[normalized] || 'bg-slate-50 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classes}`}>
        {category}
      </span>
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = isEditMode && editingId 
         ? `http://localhost:9000/api/products/${editingId}`
         : 'http://localhost:9000/api/products';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ 
          ...form, 
          price: parseFloat(form.price), 
          stock: parseInt(form.stock) 
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ name: '', description: '', price: '', stock: '', category: '', unit: '' });
        setIsEditMode(false);
        setEditingId(null);
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save product' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:9000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // Deprecated since we use explicit new page
  const openCreateModal = () => {
    router.push('/admin/products/new');
  };

  const openEditModal = (product: any) => {
    setForm({ 
      name: product.name, 
      description: product.description || '', 
      price: product.price.toString(), 
      stock: product.stock.toString(), 
      category: product.category || '',
      unit: product.unit || ''
    });
    setIsEditMode(true);
    setEditingId(product.id);
    setMessage(null);
    setIsModalOpen(true);
  };

  // Fixed top cards based on requirements
  const productCategories = [
    { label: 'Milk', unit: 'L', style: CATEGORY_STYLES['Milk'] },
    { label: 'Yogurt', unit: 'g', style: CATEGORY_STYLES['Yogurt'] },
    { label: 'Cheese', unit: 'kg', style: CATEGORY_STYLES['Cheese'] },
    { label: 'Butter', unit: 'kg', style: CATEGORY_STYLES['Butter'] }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Management</h1>
          <p className="text-slate-500 mt-1 font-medium">{products.length} product types — all internally produced</p>
        </div>
        <Button onClick={openCreateModal} variant="secondary" className="rounded-xl px-6 h-12 shadow-sm">
          + Add Product
        </Button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {productCategories.map((cat) => (
          <Card key={cat.label} className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden bg-white hover:shadow-md transition-shadow">
            <div className={`h-2 w-full ${cat.style?.split(' ')[0] || 'bg-slate-200'}`} />
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cat.style}`}>
                  {cat.label}
                </span>
              </div>
              <div className="flex items-center text-slate-900 font-bold text-lg mb-1">
                Unit: {cat.unit}
              </div>
              <p className="text-sm text-slate-500 font-medium">Internally produced</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="rounded-3xl shadow-sm border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="text-sm text-slate-500 p-12 text-center animate-pulse">Loading products...</div>
          ) : products.length === 0 ? (
             <div className="text-center p-12">
               <p className="text-slate-500">No products found. Add one above.</p>
             </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 rounded-tl-3xl">Product Name</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Unit</th>
                  <th className="px-6 py-5">Shelf Life</th>
                  <th className="px-6 py-5">Description</th>
                  <th className="px-6 py-5 text-right rounded-tr-3xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900">{p.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      {getCategoryBadge(p.category || 'Uncategorized')}
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs">{p.unit || 'unit'}</span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-medium">
                      {p.shelf_life_days ? `${p.shelf_life_days} days` : '14 days'}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-500 font-medium truncate max-w-[200px] inline-block">{p.description || '-'}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" aria-label="Edit Product">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" aria-label="Delete Product">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Product" : "Register New Product"}>
        <form onSubmit={handleCreateProduct} className="space-y-4 pt-2">
          {message && <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
          <Input label="Product Name" type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl" />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category (Milk, Yogurt, etc)" type="text" required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="rounded-xl" />
            <Input label="Unit (L, g, kg)" type="text" required value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Global Price ($)" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="rounded-xl" />
            <Input label="Initial Stock" type="number" required value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} className="rounded-xl" />
          </div>

          <Input label="Description" type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="rounded-xl" />
          
          <Button type="submit" disabled={submitLoading} className="w-full mt-8 h-12 rounded-xl shadow-sm text-sm font-bold border-0" variant="secondary">
            {submitLoading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
