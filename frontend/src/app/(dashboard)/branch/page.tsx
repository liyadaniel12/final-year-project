'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, AlertOctagon, Truck, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) return;

        const response = await fetch('http://localhost:9000/api/branch-manager/dashboard', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) {
          const text = await response.json().catch(() => ({}));
          throw new Error(text.error || 'Failed to fetch dashboard data');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error) return <div className="p-6 text-center text-rose-500 font-medium">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{data?.branchName || 'My Branch'} — Today</h1>
          <p className="text-slate-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold uppercase">
            {user?.email?.charAt(0) || 'M'}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">{user?.email || 'Branch Manager'}</div>
            <div className="text-xs text-slate-500 font-medium tracking-wide capitalize">{user?.role?.replace('_', ' ') || 'Manager'}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Horizontal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl p-6 border border-slate-200 shadow-sm bg-white hover:border-indigo-200 transition-colors flex justify-between items-center cursor-default">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Package className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold uppercase tracking-wider">Total Stock</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{data?.totalBatches || 0}</span>
              <span className="text-sm font-medium text-slate-500 mb-1.5">active batches</span>
            </div>
          </div>
        </Card>

        <Card className={`rounded-2xl p-6 shadow-sm flex justify-between items-center cursor-default transition-colors ${data?.expiredCount > 0 ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300' : 'border-amber-200 bg-amber-50/50 hover:border-amber-300'}`}>
          <div>
            <div className={`flex items-center gap-2 mb-1 ${data?.expiredCount > 0 ? 'text-rose-600' : 'text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Expiry Alerts</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className={`text-5xl font-black tracking-tighter ${data?.expiredCount > 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                {(data?.expiredCount || 0) + (data?.nearCount || 0)}
              </span>
              <span className={`text-sm font-medium mb-1.5 ${data?.expiredCount > 0 ? 'text-rose-700' : 'text-amber-700'}`}>
                {data?.expiredCount} expired, {data?.nearCount} near
              </span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Expiry Status Overview */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-slate-800 text-sm">Expiry Status Overview</h2>
        </div>
        <div className="p-5 flex flex-col justify-center divide-y divide-slate-100">
          <div className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <div><div className="font-bold text-slate-800">Green — Fresh <span className="text-xs text-slate-500 font-medium whitespace-nowrap">(&gt;7 days)</span></div></div>
            </div>
            <div className="font-bold text-lg text-emerald-600 text-right">{data?.freshCount || 0} <span className="text-sm text-emerald-600/70 font-medium">batches</span></div>
          </div>

          <div className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-amber-400"></div>
              <div><div className="font-bold text-slate-800">Yellow — Near-Expiry <span className="text-xs text-slate-500 font-medium whitespace-nowrap">(1–7 days)</span></div></div>
            </div>
            <div className="font-bold text-lg text-amber-500 text-right">{data?.nearCount || 0} <span className="text-sm text-amber-500/70 font-medium">batches</span></div>
          </div>

          <div className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-rose-500"></div>
              <div><div className="font-bold text-slate-800">Red — Expired</div></div>
            </div>
            <div className={`font-bold text-lg text-right ${data?.expiredCount > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{data?.expiredCount || 0} <span className="text-sm font-medium">batches</span></div>
          </div>
        </div>
      </Card>

      {/* Active Alerts */}
      {data?.criticalAlerts && data.criticalAlerts.length > 0 && (
        <Card className="rounded-2xl shadow-sm border border-rose-200 bg-rose-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-rose-100 flex items-center gap-2 text-rose-800">
            <AlertOctagon className="w-5 h-5" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Active Alerts</h2>
          </div>
          <div className="p-4 bg-white/60 space-y-3">
            {data.criticalAlerts.map((alert: any) => (
              <div key={alert.id} className="flex gap-4 p-4 rounded-xl bg-white border border-rose-100 shadow-sm">
                <div className="p-2.5 rounded-full bg-rose-50 text-rose-500 h-fit">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-rose-800 text-sm mb-1 uppercase tracking-wide">{alert.type} Alert</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {alert.product} batch <span className="font-mono font-semibold">{alert.batch}</span> ({alert.qty}) {alert.type === 'Expired' ? 'has expired' : `expires in `} <span className="font-bold text-rose-600">{alert.days}</span>.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
