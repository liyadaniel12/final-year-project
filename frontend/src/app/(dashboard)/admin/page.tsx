'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Authorization': `Bearer ${session?.access_token}` };

      const statsRes = await fetch('http://localhost:9000/api/system/overview', { headers });
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="p-8 text-slate-500 animate-pulse">Loading system architecture...</div>;
  }

  // Helper mapping
  const roleDisplayNames: Record<string, string> = {
    'admin': 'System Admins',
    'main_manager': 'Main Managers',
    'branch_manager': 'Branch Managers'
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Profile Section */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
          Expiry-Aware Dairy Distribution System — Admin Panel
        </p>
        
        <div className="mt-8 flex items-center space-x-4">
          <div className="h-16 w-16 bg-slate-200 text-slate-600 font-bold text-xl rounded-full flex items-center justify-center border-4 border-white shadow-sm">
            {stats.adminProfile?.full_name ? stats.adminProfile.full_name.split(' ').map((n: string) => n[0]).join('') : 'AH'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {stats.adminProfile?.full_name || 'System Administrator'}
            </h2>
            <p className="text-slate-500 font-medium">System Administrator</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 w-full" />

      {/* System Overview Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">System Overview</h2>
        <p className="text-slate-500 mb-6">Manage users, branches, and product catalogue across the network</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalUsers}</div>
              <p className="font-semibold text-slate-700 mt-2">Total Users</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">{stats.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalBranches}</div>
              <p className="font-semibold text-slate-700 mt-2">Active Branches</p>
              <p className="text-sm font-medium text-rose-500 mt-1">{stats.inactiveBranches} inactive</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalProducts}</div>
              <p className="font-semibold text-slate-700 mt-2">Product Types</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stats.productCategories} categories</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="text-4xl font-extrabold text-slate-800">{stats.totalBranchManagers}</div>
              <p className="font-semibold text-slate-700 mt-2">Branch Managers</p>
              <p className="text-sm font-medium text-emerald-600 mt-1">{stats.activeBranchManagers} active</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Users by role */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Users by Role</h3>
          <ul className="space-y-4">
            {Object.keys(roleDisplayNames).map(roleKey => (
              <li key={roleKey} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">{roleDisplayNames[roleKey]}</span>
                <span className="font-bold text-slate-900 bg-slate-100 py-1 px-3 rounded-md">
                  {stats.usersByRole[roleKey] || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Branch Status details */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Branch Status</h3>
          <div className="space-y-3">
            {stats.branchStatusDetails?.map((branch: any) => (
              <div key={branch.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800">{branch.name}</h4>
                  <p className="text-sm text-slate-500 mt-0.5">{branch.managerName}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                    branch.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {branch.status}
                  </span>
                </div>
              </div>
            ))}
            
            {stats.branchStatusDetails?.length === 0 && (
              <div className="text-sm text-slate-500 py-4 italic">No branches mapped yet.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
