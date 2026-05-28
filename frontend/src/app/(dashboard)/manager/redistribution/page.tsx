'use client';

import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, AlertCircle, XCircle, Loader2, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

export default function RedistributionPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');


  const fetchRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://final-year-project-h5uk.onrender.com'}/api/branch-manager/transfers`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch redistribution data');
      const json = await res.json();
      setRequests(json.transfers || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'Accepted': return 'bg-sky-50 border-sky-200 text-sky-800';
      case 'In-transit': return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case 'Completed': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'Rejected': return 'bg-rose-50 border-rose-200 text-rose-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'In-transit': return <Truck className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'Pending': return <AlertCircle className="w-4 h-4" />;
      default: return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg border border-indigo-100">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Branch Redistribution</h2>
          <p className="text-xs text-slate-500 font-medium">{user?.email || 'Manager'}</p>
        </div>
      </div>

      {/* Redistribution History */}
      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Redistribution History</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="In-transit">In-transit</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-white border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">From Branch</th>
                <th className="px-5 py-3"></th>
                <th className="px-5 py-3">To Branch</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.filter(t => statusFilter === 'All' || t.status === statusFilter).map(t => (
                <tr key={t.id} className="bg-white hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-600 bg-slate-50">{t.from}</td>
                  <td className="px-2 py-3 text-center"><ArrowRight className="w-4 h-4 text-indigo-500 inline-block" /></td>
                  <td className="px-5 py-3 font-medium text-indigo-700">{t.to}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{t.product}</td>
                  <td className="px-5 py-3 text-slate-800">{t.qty}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(t.status)}`}>
                      {getStatusIcon(t.status)} {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {requests.filter(t => statusFilter === 'All' || t.status === statusFilter).length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-400">No redistribution history</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>


    </div>
  );
}
