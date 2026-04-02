'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, ArrowUpRight, TrendingUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';

export default function ManagerSalesOverviewPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [productFilter, setProductFilter] = useState('All Products');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) return;

        const response = await fetch('http://localhost:9000/api/manager/sales', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to fetch sales data');
        }

        const jsonData = await response.json();
        setSales(jsonData.sales || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred fetching sales');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const filteredSales = sales.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.batch.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'All Branches' || item.branch === branchFilter;
    const matchesProduct = productFilter === 'All Products' || item.product === productFilter;
    return matchesSearch && matchesBranch && matchesProduct;
  });

  const branchOptions = Array.from(new Set(sales.map(s => s.branch))).sort();
  const productOptions = Array.from(new Set(sales.map(s => s.product))).sort();

  // Dynamic statistics computation
  const getBranchRecordCount = (branchName: string) => sales.filter(s => s.branch === branchName).length;

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <div className="p-6 text-center text-rose-500 font-medium">Error loading sales data: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Records</h1>
          <p className="text-slate-500 mt-1">All sales across branches — quantities only</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {branchOptions.slice(0, 5).map((branchName, i) => (
          <Card key={i} className="rounded-2xl shadow-sm border border-slate-100 bg-white p-5 flex flex-col justify-center items-center text-center hover:border-indigo-200 transition-colors cursor-default">
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">{branchName as string}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{getBranchRecordCount(branchName as string)}</span>
              <span className="text-sm font-medium text-slate-400">records</span>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500 mt-2 opacity-80" />
          </Card>
        ))}
        {branchOptions.length === 0 && (
          <div className="col-span-5 text-center text-slate-400 py-4 italic border rounded-xl bg-slate-50">
            No sales recorded yet. Your branches have not logged any completed checkout transactions.
          </div>
        )}
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product, batch, or recorder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
              <option>All Branches</option>
              {branchOptions.map(b => <option key={b as string}>{b as string}</option>)}
            </select>

            <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
              <option>All Products</option>
              {productOptions.map(p => <option key={p as string}>{p as string}</option>)}
            </select>
          </div>
          
          <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            {filteredSales.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date & Time</div></th>
                <th className="px-6 py-4 font-semibold">Branch</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Batch No.</th>
                <th className="px-6 py-4 font-semibold text-emerald-700"><div className="flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5" /> Qty Sold</div></th>
                <th className="px-6 py-4 font-semibold">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length > 0 ? filteredSales.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 whitespace-nowrap">{item.date}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{item.time}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{item.branch}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.product}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.batch}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 bg-emerald-50/30 whitespace-nowrap">
                    {item.sold}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{item.recordedBy}</td>
                </tr>
              )) : (
                 <tr><td colSpan={6} className="text-center py-6 text-slate-500">No sales transactions located.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
