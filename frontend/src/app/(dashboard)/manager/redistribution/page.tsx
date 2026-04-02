'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Search, History, CheckCircle2, AlertCircle, XCircle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';

export default function RedistributionOverviewPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) return;

        const response = await fetch('http://localhost:9000/api/manager/transfers', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to fetch transfers');
        }

        const jsonData = await response.json();
        setTransfers(jsonData.transfers || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred fetching transfers');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const activeCount = transfers.filter(t => t.status === 'Pending' || t.status === 'Accepted' || t.status === 'In-transit').length;
  const pendingCount = transfers.filter(t => t.status === 'Pending').length;
  const completedCount = transfers.filter(t => t.status === 'Completed').length;
  const rejectedCount = transfers.filter(t => t.status === 'Rejected').length;
  const historyCount = completedCount + rejectedCount;

  const transferStats = [
    { name: 'Active Transfers', count: activeCount, icon: <ArrowRightLeft className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { name: 'Pending Approval', count: pendingCount, icon: <AlertCircle className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { name: 'Completed', count: completedCount, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { name: 'Rejected', count: rejectedCount, icon: <XCircle className="w-5 h-5" />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' }
  ];

  const filteredTransfers = transfers.filter((item) => {
    const isHistory = item.status === 'Completed' || item.status === 'Rejected';
    const tabMatch = activeTab === 'active' ? !isHistory : isHistory;
    const searchMatch = item.from.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.to.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.batch.toLowerCase().includes(searchTerm.toLowerCase());
    return tabMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">Pending</span>;
      case 'Accepted':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200 shadow-sm">Accepted</span>;
      case 'In-transit':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">In-transit</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">Completed</span>;
      case 'Rejected':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">Rejected</span>;
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Redistribution Overview</h1>
          <p className="text-slate-500 mt-1">All transfer requests across branches</p>
        </div>
      </div>

      {error ? (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-600 font-medium">Error loading transfers: {error}</Card>
      ) : transfers.length === 0 ? (
         <Card className="p-4 border-slate-200 bg-slate-50 text-slate-500 italic text-center">No transfer activities found. Pending or historic transfers sent between branches will dynamically populate here.</Card>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {transferStats.map((stat, i) => (
          <Card key={i} className={`rounded-2xl shadow-sm border p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-default ${stat.bg}`}>
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">{stat.name}</p>
              <h3 className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.count}</h3>
            </div>
            <div className={`p-3 rounded-full bg-white/60 shadow-sm border border-white/40 ${stat.color}`}>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between px-5 pt-3">
          
          <div className="flex items-center gap-6 mt-2 md:mt-0 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('active')}
              className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'active' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Active ({activeCount})
              {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_4px_rgba(79,70,229,0.3)]"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-2 font-medium text-sm transition-colors relative flex items-center gap-1.5 ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <History className="w-4 h-4" /> History ({historyCount})
              {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_4px_rgba(79,70,229,0.3)]"></div>}
            </button>
          </div>

          <div className="relative max-w-sm w-full md:w-64 pb-3">
            <Search className="absolute left-3 top-[35%] -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">From Branch</th>
                <th className="px-6 py-4 font-semibold">To Branch</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length > 0 ? filteredTransfers.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
                      {item.from}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-slate-300" />
                      <span className="inline-flex items-center gap-2 font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/60">
                        {item.to}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.product}</div>
                    <div className="font-mono text-[10px] text-slate-500 mt-1">{item.batch}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{item.qty}</td>
                  <td className="px-6 py-4 text-right">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              )) : (
                 <tr><td colSpan={5} className="text-center py-8 text-slate-500">No transfers found in this tab.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
