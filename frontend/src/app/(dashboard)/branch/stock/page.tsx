'use client';

import React, { useState, useEffect } from 'react';
import { Package, CalendarPlus, Search, Info, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

export default function BranchStockPage() {
  const { user } = useAuth();
  const [productType, setProductType] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:9000/api/products');
        const json = await response.json();
        setProducts(json.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Authentication required");

      const res = await fetch('http://localhost:9000/api/branch-manager/stock', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productType,
          quantity: Number(quantity),
          expiry_date: expiryDate
        })
      });

      if (!res.ok) {
        const text = await res.json();
        throw new Error(text.error || "Failed to add stock");
      }

      setSuccess("Successfully recorded stock entry!");
      setProductType('');
      setQuantity('');
      setExpiryDate('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === productType);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Record Stock</h1>
          <p className="text-slate-500 mt-1">Log incoming stock for your branch</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
            {user?.email?.charAt(0) || 'M'}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">{user?.email || 'Manager'}</div>
            <div className="text-xs text-slate-500 font-medium">Branch Operations</div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <CalendarPlus className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800 text-lg">New Stock Entry</h2>
        </div>

        {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Type</label>
              <select required value={productType} onChange={e => setProductType(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium">
                <option value="" disabled>Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity</label>
              <div className="relative">
                <input required type="number" step="0.01" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder={productType ? "Enter amount" : "Select product first"} disabled={!productType} className="w-full h-11 px-3 pr-12 rounded-xl border border-slate-200 text-sm bg-white disabled:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium placeholder:text-slate-400" />
                {selectedProduct && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                    {selectedProduct.unit}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expiry Date</label>
              <input required value={expiryDate} onChange={e => setExpiryDate(e.target.value)} type="date" className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium" />
            </div>
          </div>

          <div className="pt-4 flex justify-start">
            <Button disabled={submitLoading} type="submit" className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm w-full md:w-auto">
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Stock Record'}
            </Button>
          </div>
        </form>
      </Card>
      
    </div>
  );
}
