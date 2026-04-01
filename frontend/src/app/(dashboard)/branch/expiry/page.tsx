'use client';

import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, PieChart, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';

export default function BranchExpiryOverviewPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('All Products');

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) return;

        const response = await fetch('http://localhost:9000/api/branch-manager/stock', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch expiry data');

        const jsonData = await response.json();
        const sortedStock = (jsonData.stock || []).sort((a: any, b: any) => new Date(a.rawExpiry).getTime() - new Date(b.rawExpiry).getTime());
        setStock(sortedStock);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  const filteredExpiry = stock.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) || item.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === 'All Products' || item.product === productFilter;
    return matchesSearch && matchesProduct;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Fresh': return 'bg-emerald-100 text-emerald-800';
      case 'Near Expiry': return 'bg-amber-100 text-amber-800';
      case 'Expired': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Fresh': return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'Near Expiry': return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'Expired': return <XCircle className="w-3.5 h-3.5 mr-1" />;
      default: return null;
    }
  };

  const productOptions = Array.from(new Set(stock.map(s => s.product))).sort();

  const totalBatches = stock.length;
  const freshCount = stock.filter(s => s.status === 'Fresh').length;
  const nearCount = stock.filter(s => s.status === 'Near Expiry').length;
  const expiredCount = stock.filter(s => s.status === 'Expired').length;

  const freshPct = totalBatches > 0 ? Math.round((freshCount / totalBatches) * 100) : 0;
  const nearPct = totalBatches > 0 ? Math.round((nearCount / totalBatches) * 100) : 0;
  const expPct = totalBatches > 0 ? Math.round((expiredCount / totalBatches) * 100) : 0;

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expiry Alerts</h1>
          <p className="text-slate-500 mt-1">Review freshness and prioritize distribution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-emerald-100"><CheckCircle className="w-32 h-32" /></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-emerald-800 font-bold text-lg">Fresh (Green)</h3>
            <p className="text-emerald-600 font-medium text-sm">More than 7 days remaining</p>
          </div>
          <div className="relative z-10 flex items-end gap-3 mt-6">
            <span className="text-5xl font-black text-emerald-600 tracking-tighter">{freshPct}%</span>
            <span className="text-lg font-bold text-emerald-800 mb-1">{freshCount} <span className="text-emerald-600 font-medium text-sm">/ {totalBatches} batches</span></span>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-amber-100 bg-amber-50/30 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-amber-100"><AlertTriangle className="w-32 h-32" /></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-amber-800 font-bold text-lg">Near Expiry (Yellow)</h3>
            <p className="text-amber-600 font-medium text-sm">Within 7 days remaining</p>
          </div>
          <div className="relative z-10 flex items-end gap-3 mt-6">
            <span className="text-5xl font-black text-amber-500 tracking-tighter">{nearPct}%</span>
            <span className="text-lg font-bold text-amber-800 mb-1">{nearCount} <span className="text-amber-600 font-medium text-sm">/ {totalBatches} batches</span></span>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-rose-100 bg-rose-50/30 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-rose-100"><XCircle className="w-32 h-32" /></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-rose-800 font-bold text-lg">Expired (Red)</h3>
            <p className="text-rose-600 font-medium text-sm">Requires immediate removal</p>
          </div>
          <div className="relative z-10 flex items-end gap-3 mt-6">
            <span className="text-5xl font-black text-rose-600 tracking-tighter">{expPct}%</span>
            <span className="text-lg font-bold text-rose-800 mb-1">{expiredCount} <span className="text-rose-600 font-medium text-sm">/ {totalBatches} batches</span></span>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search batches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400" />
            </div>
            
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
              <option>All Products</option>
              {productOptions.map(p => <option key={p as string}>{p as string}</option>)}
            </select>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-400" /> {filteredExpiry.length} local batches
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Batch</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Expiry Date</th>
                <th className="px-6 py-4 font-semibold text-center">Days Left</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpiry.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.product}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.batch}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.formattedQty}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{new Date(item.rawExpiry).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold text-lg ${item.daysLeft === '—' ? 'text-rose-500' : 'text-slate-800'}`}>{item.daysLeft}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(item.status)}`}>
                      {getStatusIcon(item.status)} {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredExpiry.length === 0 && (
                 <tr><td colSpan={6} className="text-center py-6 text-slate-500">No stock found for selected filters in this branch.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
