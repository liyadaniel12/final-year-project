'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, XCircle, TrendingUp, Store, Activity, AlertOctagon, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';

export default function ManagerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          // Let AuthProvider handle unauthenticated routing
          return;
        }

        const token = session.access_token;

        const response = await fetch('http://localhost:9000/api/system/manager-dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
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

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-rose-500 font-medium">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Live snapshot of your dairy distribution network</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            {data.managerInfo.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">{data.managerInfo.name}</div>
            <div className="text-xs text-slate-500 font-medium">{data.managerInfo.role}</div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {data.criticalAlerts && data.criticalAlerts.length > 0 && (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50/50 overflow-hidden shadow-sm">
          <div className="bg-rose-500 px-4 py-2 flex items-center gap-2 text-white font-bold text-sm">
            <AlertOctagon className="w-4 h-4" />
            {data.criticalAlerts.length} Critical Alerts — Immediate Action Required
          </div>
          <div className="p-4 space-y-3">
            {data.criticalAlerts.map((alert: any) => (
              alert.type === 'expired' ? (
                <div key={alert.id} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium">
                    {alert.productName} batch #{alert.batch.toUpperCase()} has <span className="text-rose-600 font-bold">EXPIRED</span> at {alert.branchName}. Immediate action required.
                  </p>
                </div>
              ) : (
                <div key={alert.id} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium">
                    {alert.productName} batch #{alert.batch.toUpperCase()} is expiring in <span className="text-amber-600 font-bold">{alert.days} day{alert.days !== 1 ? 's' : ''}</span> at {alert.branchName}.
                  </p>
                </div>
              )
            ))}
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Package className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Stock Batches</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{data.kpis.totalStockBatches}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">across all branches</p>
        </Card>

        <Card className="rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Near Expiry</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{data.kpis.nearExpiryItems}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium text-amber-600">30 days remaining</p>
        </Card>

        <Card className="rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors text-rose-900 bg-rose-50/30 border-rose-100">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Expired Products</span>
          </div>
          <div className="text-3xl font-black text-rose-700">{data.kpis.expiredItems}</div>
          <p className="text-xs mt-1 font-medium text-rose-600/80 uppercase">requires removal</p>
        </Card>

        <Card className="rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Sales Txns</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{data.kpis.monthlySalesTxns}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium text-emerald-600">recorded this month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stock Levels */}
        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800">Stock Levels by Branch</h2>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {data.branchPerformance && data.branchPerformance.length > 0 ? (
              data.branchPerformance.map((bp: any) => (
                <div key={bp.id} className={`space-y-1 p-4 rounded-xl border ${bp.risk === 'High' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`font-bold ${bp.risk === 'High' ? 'text-rose-800' : 'text-slate-800'}`}>{bp.branch}</h3>
                  <p className={`text-sm font-medium ${bp.risk === 'High' ? 'text-rose-600/80' : 'text-slate-500'}`}>{bp.batches} batches</p>
                  <div className={`text-2xl font-black pt-1 ${parseInt(bp.fresh) >= 90 ? 'text-emerald-600' : parseInt(bp.fresh) >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{bp.fresh}</div>
                  <div className="text-xs text-amber-600 font-bold">{bp.near} near-expiry</div>
                  {bp.expired > 0 ? (
                    <div className="text-xs text-rose-600 font-bold">{bp.expired} expired</div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium">—</div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-4 text-slate-500">No branches tracked yet</div>
            )}
          </div>
        </Card>

        {/* Right Column - Sales & Transfers */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-sm">Sales Summary</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 opacity-50">
                <div>
                  <div className="font-bold text-slate-800">Today</div>
                  <div className="text-xs text-slate-500">Pending Setup</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-emerald-600">0</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transactions</div>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 opacity-50">
                <div>
                  <div className="font-bold text-slate-800">This Week</div>
                  <div className="text-xs text-slate-500">Pending Setup</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-indigo-600">0</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transactions</div>
                </div>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <div>
                  <div className="font-bold text-slate-800">This Month</div>
                  <div className="text-xs text-slate-500">Pending Setup</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-slate-700">0</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transactions</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden opacity-50">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-sm">Active Transfers</h2>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-700">In-progress redistributions</div>
              </div>
              <div className="text-3xl font-black text-amber-500">0</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Performance Summary Table */}
      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">Branch Performance Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Total Batches</th>
                <th className="px-6 py-4 text-amber-600">Near Expiry</th>
                <th className="px-6 py-4 text-rose-600">Expired</th>
                <th className="px-6 py-4">Freshness</th>
                <th className="px-6 py-4">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.branchPerformance && data.branchPerformance.map((row: any) => (
                <tr key={row.id} className="bg-white hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{row.branch}</div>
                    <div className="text-xs text-slate-500 font-medium">{row.manager}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{row.batches}</td>
                  <td className="px-6 py-4 font-bold text-amber-600">{row.near}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">{row.expired}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${parseInt(row.fresh) >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {row.fresh}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${row.risk === 'Low' ? 'bg-emerald-50 text-emerald-600' : row.risk === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
