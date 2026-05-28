'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Building2, Package, UserCheck, Activity, ShieldCheck, Database, LayoutDashboard } from 'lucide-react';

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

      const statsRes = await fetch('https://final-year-project-h5uk.onrender.com/api/system/overview', { headers });
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
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#2E7D32]/20 border-t-[#2E7D32] rounded-full animate-spin"></div>
          <p className="text-[#2E7D32] font-semibold text-lg animate-pulse">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-[80vh]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 text-red-500 mb-6 shadow-sm border border-red-100">
          <Database className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Connection Lost</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">{error}</p>
        <button 
          onClick={fetchDashboardData} 
          className="px-8 py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-900/20 active:scale-95"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const roleDisplayNames: Record<string, string> = {
    'admin': 'System Admins',
    'main_manager': 'Main Managers',
    'branch_manager': 'Branch Managers'
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1">Manage users, branches and product categories across the network</p>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Stat Card 1 */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-100/50 text-blue-600 rounded-2xl group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
               <Users className="w-7 h-7" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-black text-slate-800 mb-1 tracking-tight">{stats.totalUsers}</div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wide">Total Users</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
              <Activity className="w-4 h-4" />
              {stats.activeUsers} active now
            </div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-100/50 text-emerald-600 rounded-2xl group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
               <Building2 className="w-7 h-7" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-black text-slate-800 mb-1 tracking-tight">{stats.totalBranches}</div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wide">Active Branches</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
              <Activity className="w-4 h-4" />
              {stats.inactiveBranches} inactive
            </div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="p-4 bg-amber-100/50 text-amber-600 rounded-2xl group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
               <Package className="w-7 h-7" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-black text-slate-800 mb-1 tracking-tight">{stats.totalProducts}</div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wide">Product Types</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
              <LayoutDashboard className="w-4 h-4" />
              {stats.productCategories} categories
            </div>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2E7D32]/5 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="p-4 bg-[#2E7D32]/10 text-[#2E7D32] rounded-2xl group-hover:bg-[#2E7D32]/20 transition-colors">
               <UserCheck className="w-7 h-7" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-black text-slate-800 mb-1 tracking-tight">{stats.totalBranchManagers}</div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wide">Branch Managers</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-3 py-1 rounded-lg">
              <Activity className="w-4 h-4" />
              {stats.activeBranchManagers} active
            </div>
          </div>
        </div>

      </div>

      {/* 3. DETAILS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Roles Breakdown */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">System Roles</h3>
               <p className="text-sm font-medium text-slate-500 mt-1">Distribution of users across the platform</p>
            </div>
            
            <div className="p-8 flex-1">
               <ul className="space-y-5">
                 {Object.keys(roleDisplayNames).map(roleKey => (
                   <li key={roleKey} className="group">
                     <div className="flex justify-between items-center mb-3">
                       <span className="font-bold text-slate-700 text-sm tracking-wide">{roleDisplayNames[roleKey]}</span>
                       <span className="font-black text-slate-900 bg-slate-100 py-1 px-4 rounded-xl text-sm">
                         {stats.usersByRole[roleKey] || 0}
                       </span>
                     </div>
                     {/* Visual Progress Bar */}
                     <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-[#2E7D32] rounded-full transition-all duration-1000 ease-out group-hover:bg-[#FF9800]"
                         style={{ 
                           width: `${Math.max(10, ((stats.usersByRole[roleKey] || 0) / stats.totalUsers) * 100)}%` 
                         }}
                       ></div>
                     </div>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>

        {/* Branch Mapping */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Branch Status</h3>
                 <p className="text-sm font-medium text-slate-500 mt-1">Directory of all operational branches</p>
               </div>
               <div className="px-4 py-2 bg-[#FFF8E7] text-[#FF9800] rounded-xl font-bold text-sm border border-orange-100">
                 {stats.branchStatusDetails?.length || 0} Facilities
               </div>
            </div>

            <div className="p-6 flex-1 bg-slate-50/30">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {stats.branchStatusDetails?.map((branch: any) => (
                   <div key={branch.id} className="flex flex-col p-6 bg-white border border-slate-100 rounded-[1.5rem] transition-all duration-300 hover:shadow-lg hover:border-slate-200 group">
                     <div className="flex justify-between items-start mb-4">
                       <h4 className="font-black text-lg text-slate-800 tracking-tight group-hover:text-[#2E7D32] transition-colors">{branch.name}</h4>
                       <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg border ${
                         branch.status === 'active' 
                           ? 'bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20' 
                           : 'bg-rose-50 text-rose-600 border-rose-200'
                       }`}>
                         {branch.status}
                       </span>
                     </div>
                     <div className="mt-auto pt-4 border-t border-slate-50 flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                         {branch.managerName.substring(0,2).toUpperCase()}
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned Manager</p>
                         <p className="text-sm font-bold text-slate-700">{branch.managerName}</p>
                       </div>
                     </div>
                   </div>
                 ))}
                 
                 {stats.branchStatusDetails?.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-12 text-center col-span-full bg-white rounded-[1.5rem] border-2 border-slate-100 border-dashed">
                     <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                     <p className="text-lg font-bold text-slate-600">No branches mapped yet</p>
                     <p className="text-slate-400 mt-1 font-medium">Add a branch in the system to see it here.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
