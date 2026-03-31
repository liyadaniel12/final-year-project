'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabaseClient';

export default function ProductManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '' });

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
      if (res.ok) setProducts((await res.json()).products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:9000/api/products', {
        method: 'POST',
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
        setForm({ name: '', description: '', price: '', stock: '', category: '' });
        fetchProducts();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create product' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Management</h1>
          <p className="text-slate-500 mt-1">Manage global product registry, pricing, and initial stock.</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setMessage(null); }} variant="secondary" className="rounded-xl px-6">
          + Add Product
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-0 border-t-4 border-t-rose-400">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-sm text-slate-500 p-8 text-center">Loading products...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Global Price</th>
                    <th className="px-6 py-4">Core Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No products found.</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 uppercase text-[10px] font-bold tracking-wider">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {p.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-bold tracking-wide">${parseFloat(p.price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.stock} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {message && <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
          <Input label="Product Name" type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price ($)" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="rounded-xl" />
            <Input label="Initial Stock" type="number" required value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} className="rounded-xl" />
          </div>
          <Input label="Category Group" type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="rounded-xl" />
          <Input label="Description" type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="rounded-xl" />
          <Button type="submit" disabled={submitLoading} className="w-full mt-6 h-11 rounded-xl shadow-sm text-sm font-medium border-0" variant="secondary">
            {submitLoading ? 'Registering...' : 'Create Product'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
