'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Search, History, CheckCircle2, AlertCircle, XCircle, ArrowRightLeft, Check, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

export default function BranchTransferPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) return;

      const response = await fetch('http://localhost:9000/api/branch-manager/transfers', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transfers');
      const jsonData = await response.json();
      setTransfers(jsonData.transfers || []);
    } catch (err: any) {
      console.error("Transfers error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`http://localhost:9000/api/branch-manager/transfers/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Update failed');
      await fetchTransfers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
      case 'Accepted': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">Accepted</span>;
      case 'In-transit': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">In-transit</span>;
      case 'Completed': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'Rejected': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default: return <span>{status}</span>;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const pendingInbound = transfers.filter(t => t.direction === 'Inbound' && t.status === 'Pending');
  const allOtherTransfers = transfers.filter(t => !(t.direction === 'Inbound' && t.status === 'Pending'));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Redistribution Inbox</h1>
          <p className="text-slate-500 mt-1">Accept or reject stock transfer requests matching your branch</p>
        </div>
      </div>

      {pendingInbound.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Needs Your Action
          </h2>
          {pendingInbound.map(t => (
            <Card key={t.id} className="p-4 rounded-xl shadow-sm border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                  <Truck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">Incoming: {t.product}</h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    <span className="font-semibold text-slate-800">{t.qty}</span> requested from <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded">{t.from}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 w-fit bg-white px-1 border border-slate-100 rounded">Batch: {t.batch}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button 
                  disabled={actionLoading === t.id}
                  onClick={() => handleUpdateStatus(t.id, 'Rejected')}
                  className="flex-1 sm:flex-none border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 h-10 px-4 rounded-lg text-sm shadow-sm font-bold gap-1.5"
                >
                  <X className="w-4 h-4" /> Reject
                </Button>
                <Button 
                  disabled={actionLoading === t.id}
                  onClick={() => handleUpdateStatus(t.id, 'Accepted')}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 rounded-lg text-sm shadow-sm font-bold gap-1.5"
                >
                  {actionLoading === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Accept</>}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden mt-8">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="font-bold text-slate-800">Transfer Log</h2>
          </div>
          <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{allOtherTransfers.length} records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 tracking-wider">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Other Branch</th>
                <th className="px-5 py-3">Product / Batch</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allOtherTransfers.length > 0 ? allOtherTransfers.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${item.direction === 'Inbound' ? 'text-indigo-600' : 'text-slate-600'}`}>
                      {item.direction === 'Inbound' ? <ArrowRightLeft className="w-3 h-3 rotate-90" /> : <ArrowRightLeft className="w-3 h-3" />}
                      {item.direction}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700 bg-slate-50/30">
                    {item.direction === 'Inbound' ? item.from : item.to}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{item.product}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-1">{item.batch}</div>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-700">{item.formattedQty}</td>
                  <td className="px-5 py-4 text-right">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              )) : (
                 <tr><td colSpan={5} className="text-center py-8 text-slate-500">No logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
