'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

export default function ManagerStockOverviewPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) return;

        const response = await fetch('http://localhost:9000/api/manager/stock', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to fetch stock data');
        }

        const jsonData = await response.json();
        const sortedStock = (jsonData.stock || []).sort((a: any, b: any) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
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

  const filteredStock = stock.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) || item.branch.toLowerCase().includes(searchTerm.toLowerCase()) || item.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'All Branches' || item.branch === branchFilter;
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fresh':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Fresh</span>;
      case 'Near Expiry':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1" /> Near Expiry</span>;
      case 'Expired':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" /> Expired</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const branchOptions = Array.from(new Set(stock.map(s => s.branch))).sort();

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <div className="p-6 text-center text-rose-500 font-medium">Error loading stock data: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stock Overview</h1>
          <p className="text-slate-500 mt-1">Current inventory across all branches</p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product, branch, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
              <option>All Branches</option>
              {branchOptions.map(b => (
                <option key={b as string} value={b as string}>{b as string}</option>
              ))}
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
              <option>All Statuses</option>
              <option>Fresh</option>
              <option>Near Expiry</option>
              <option>Expired</option>
            </select>
          </div>
          
          <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            {filteredStock.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Branch</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Batch Number</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Expiry Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.length > 0 ? filteredStock.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{item.branch}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.product}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.batch}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.qty}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(item.expiry).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-6 text-slate-500">No stock found for selected filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
