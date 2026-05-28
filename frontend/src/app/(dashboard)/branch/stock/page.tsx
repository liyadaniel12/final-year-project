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
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://final-year-project-h5uk.onrender.com/api/products?active_only=true');
        const json = await response.json();
        setProducts(json.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchStockHistory = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) return;

        const response = await fetch('https://final-year-project-h5uk.onrender.com/api/branch-manager/stock', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stock history');
        const jsonData = await response.json();
        setStockHistory(jsonData.stock || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setStockLoading(false);
      }
    };

    fetchProducts();
    fetchStockHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Authentication required");

      const res = await fetch('https://final-year-project-h5uk.onrender.com/api/branch-manager/stock', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productType,
          quantity: Number(quantity),
          batch_number: batchNumber
        })
      });

      if (!res.ok) {
        const text = await res.json();
        throw new Error(text.error || "Failed to add stock");
      }

      setSuccess("Successfully recorded stock entry!");
      setProductType('');
      setQuantity('');
      setBatchNumber('');
      
      // Refresh stock history quietly
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch('https://final-year-project-h5uk.onrender.com/api/branch-manager/stock', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (response.ok) {
            const jsonData = await response.json();
            setStockHistory(jsonData.stock || []);
          }
        }
      } catch (err) {
        console.error('Failed to refresh stock history', err);
      }
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Batch Number</label>
              <input required value={batchNumber} onChange={e => setBatchNumber(e.target.value)} type="text" placeholder="e.g. M-1092-A" className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium placeholder:text-slate-400" />
            </div>

            {selectedProduct && (
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculated Expiry Date</label>
                <div className="text-slate-900 font-bold">
                  {new Date(Date.now() + (selectedProduct.shelf_life_days || 0) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-xs text-slate-500 mt-1">Based on a {selectedProduct.shelf_life_days || 0}-day predetermined shelf life</div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-start">
            <Button disabled={submitLoading} type="submit" className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm w-full md:w-auto">
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Stock Record'}
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Stock History View */}
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock History</h2>
            <p className="text-slate-500 mt-1">Recently recorded stock batches for your branch</p>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
          {stockLoading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Batch Number</th>
                    <th className="px-6 py-4 font-semibold">Quantity</th>
                    <th className="px-6 py-4 font-semibold">Expiry Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockHistory.length > 0 ? stockHistory.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.product}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.batch}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.formattedQty}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(item.rawExpiry).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {item.status === 'Fresh' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Fresh</span>}
                        {item.status === 'Near Expiry' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Info className="w-3 h-3 mr-1" /> Near Expiry</span>}
                        {item.status === 'Expired' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><Info className="w-3 h-3 mr-1" /> Expired</span>}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center py-6 text-slate-500">No stock history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
