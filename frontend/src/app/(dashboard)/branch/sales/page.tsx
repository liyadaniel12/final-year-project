'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, AlertTriangle, Package, Zap, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

export default function BranchSalesPage() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStock = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) return;

      const response = await fetch('http://localhost:9000/api/branch-manager/stock', {
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
  }, []);

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Authentication required");

      const res = await fetch('http://localhost:9000/api/branch-manager/sales', {
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

      {/* Current Batch Levels View */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">Current Local Batches Overview</h2>
        </div>
        
        <div className="p-5 bg-slate-50/50">
          {stock.length === 0 ? (
            <div className="text-center text-slate-400 py-8 italic border rounded-xl bg-slate-50">No stock available. Log new stock first.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stock.map((batch) => (
                <div key={batch.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all cursor-default relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${batch.status === 'Fresh' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <div className="flex justify-between items-start mb-6 mt-1">
                    <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center shrink-0 border ${batch.status === 'Fresh' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {batch.status === 'Fresh' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    </div>
                    <span className={`inline-flex px-2 py-1 items-center gap-1 rounded font-bold text-xs border ${batch.status === 'Fresh' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {batch.daysLeft}
                    </span>
                  </div>
                  
                  <div className="mb-6 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xl leading-tight">{batch.product}</h3>
                    <div className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit">{batch.batch}</div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Remaining</div>
                        <div className="font-black text-indigo-950 text-2xl tracking-tight leading-none">{batch.qty} <span className="text-sm font-bold text-slate-500">{batch.unit}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
    </div>
  );
}
