'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, AlertTriangle, Package, Zap, Loader2, Calendar, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

export default function BranchSalesPage() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [stock, setStock] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStock = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) return;

      const response = await fetch('https://final-year-project-h5uk.onrender.com/api/branch-manager/stock', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch stock data');
      const jsonData = await response.json();
      setStock((jsonData.stock || []).filter((s:any) => s.qty > 0)); // Only show batches with active quantity
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) return;

      const response = await fetch('https://final-year-project-h5uk.onrender.com/api/branch-manager/sales', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch sales data');
      const jsonData = await response.json();
      setSalesHistory(jsonData.sales || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Authentication required");

      const res = await fetch('https://final-year-project-h5uk.onrender.com/api/branch-manager/sales', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_id: selectedBatch,
          quantity: Number(quantity)
        })
      });

      if (!res.ok) {
        const text = await res.json();
        throw new Error(text.error || "Failed to record sale");
      }

      setSuccess("Sale recorded successfully! Stock has been updated automatically.");
      setSelectedBatch('');
      setQuantity('');
      
      // Refresh local stock quietly
      await fetchStock();
      await fetchSalesHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedBatchData = stock.find(b => b.id === selectedBatch);

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Update Sales</h1>
          <p className="text-slate-500 mt-1">Record sold quantities — stock updates automatically</p>
        </div>
      </div>

      {/* Record Sale Form */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <ShoppingCart className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800 text-lg">Record Sale</h2>
        </div>

        {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <form className="space-y-6" onSubmit={handleSale}>
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Product Batch</label>
              <select 
                required
                value={selectedBatch} 
                onChange={e => setSelectedBatch(e.target.value)} 
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium shadow-sm transition-shadow"
              >
                <option value="" disabled>Choose product batch...</option>
                {stock.map(b => (
                  <option key={b.id} value={b.id}>{b.product} (Batch {b.batch}) — {b.formattedQty} remaining</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity Sold</label>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max={selectedBatchData ? selectedBatchData.qty : undefined}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Enter quantity sold..." 
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium placeholder:text-slate-400 shadow-sm transition-shadow" 
                />
                {selectedBatchData && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                    {selectedBatchData.unit}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <Button disabled={submitLoading || !selectedBatch} type="submit" className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm w-full md:w-auto flex items-center gap-2">
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Update Sales</>}
            </Button>
          </div>
        </form>
      </Card>


      
      {/* Sales History View */}
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sales History</h2>
            <p className="text-slate-500 mt-1">Recently recorded sales for your branch</p>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
          {salesLoading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date & Time</div></th>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Batch No.</th>
                    <th className="px-6 py-4 font-semibold text-emerald-700"><div className="flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5" /> Qty Sold</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesHistory.length > 0 ? salesHistory.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 whitespace-nowrap">{item.date}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{item.time}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{item.product}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.batch}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 bg-emerald-50/30 whitespace-nowrap">
                        {item.formattedSold}
                      </td>
                    </tr>
                  )) : (
                     <tr><td colSpan={4} className="text-center py-6 text-slate-500">No sales transactions located.</td></tr>
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
