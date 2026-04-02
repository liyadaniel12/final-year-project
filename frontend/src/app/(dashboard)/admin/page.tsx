'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { Users, Building2, Package, UserCheck } from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Authorization': `Bearer ${session?.access_token}` };

      const statsRes = await fetch('http://localhost:9000/api/system/overview', { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        const errData = await statsRes.json().catch(() => ({}));
        setError(errData.error || `Failed to fetch data (Status ${statsRes.status})`);
      }
    } catch (err: any) {
      console.warn('Error fetching dashboard data:', err);
      setError('Unable to reach the server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading system architecture...</div>;
  }

  if (error) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">{error}</p>
        <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Helper mapping
  const roleDisplayNames: Record<string, string> = {
    'admin': 'System Admins',
    'main_manager': 'Main Managers',
    'branch_manager': 'Branch Managers'
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Expiry-Aware Dairy Distribution System — Admin Panel</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-slate-50 p-2 pr-6 rounded-full border border-slate-100">
          <div className="h-12 w-12 bg-white text-indigo-600 font-bold text-lg rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
            {stats.adminProfile?.full_name ? stats.adminProfile.full_name.split(' ').map((n: string) => n[0]).join('') : 'AH'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {stats.adminProfile?.full_name || 'System Administrator'}
            </h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">System Admin</p>
          </div>
        </div>
      </div>

      {/* System Overview Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="rounded-3xl shadow-sm border-slate-100 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalUsers}</div>
              <p className="font-bold text-slate-700 mt-1">Total Users</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">{stats.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm border-slate-100 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                   <Building2 className="w-6 h-6" />
                </div>
              </div>
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalBranches}</div>
              <p className="font-bold text-slate-700 mt-1">Active Branches</p>
              <p className="text-sm font-medium text-rose-500 mt-1">{stats.inactiveBranches} inactive</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm border-slate-100 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                   <Package className="w-6 h-6" />
                </div>
              </div>
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalProducts}</div>
              <p className="font-bold text-slate-700 mt-1">Product Types</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stats.productCategories} categories</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm border-slate-100 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                   <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalBranchManagers}</div>
              <p className="font-bold text-slate-700 mt-1">Branch Managers</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">{stats.activeBranchManagers} active</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Users by role */}
        <div className="lg:col-span-1">
          <Card className="rounded-3xl shadow-sm border border-slate-100 bg-white h-full">
            <CardContent className="p-6">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Users by Role</h3>
               <ul className="space-y-4">
                 {Object.keys(roleDisplayNames).map(roleKey => (
                   <li key={roleKey} className="flex justify-between items-center text-sm p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                     <span className="font-bold text-slate-700">{roleDisplayNames[roleKey]}</span>
                     <span className="font-bold text-slate-900 bg-white shadow-sm border border-slate-200 py-1.5 px-4 rounded-full">
                       {stats.usersByRole[roleKey] || 0}
                     </span>
                   </li>
                 ))}
               </ul>
            </CardContent>
          </Card>
        </div>

        {/* Branch Status details */}
        <div className="lg:col-span-2">
          <Card className="rounded-3xl shadow-sm border border-slate-100 bg-white h-full">
            <CardContent className="p-6">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Branch Mapping</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {stats.branchStatusDetails?.map((branch: any) => (
                   <div key={branch.id} className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100/80 rounded-2xl transition-all hover:bg-white hover:shadow-sm">
                     <div>
                       <h4 className="font-bold text-slate-900">{branch.name}</h4>
                       <p className="text-xs font-medium text-slate-500 mt-1 bg-white inline-block px-2 py-0.5 rounded border border-slate-200 shadow-sm">{branch.managerName}</p>
                     </div>
                     <div>
                       <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                         branch.status === 'active' 
                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                           : 'bg-rose-50 text-rose-700 border-rose-200'
                       }`}>
                         {branch.status}
                       </span>
                     </div>
                   </div>
                 ))}
                 
                 {stats.branchStatusDetails?.length === 0 && (
                   <div className="text-sm font-medium text-slate-500 py-8 text-center col-span-2 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">No branches mapped yet.</div>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
