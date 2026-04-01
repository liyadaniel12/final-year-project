'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabaseClient';
import { Edit2, MapPin, User, Package, Layers, AlertTriangle, AlertOctagon, Store, Building2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  managerName?: string;
  totalStock?: number;
  productTypes?: number;
  nearExpiry?: number;
  expired?: number;
}

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', location: '', status: 'active' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:9000/api/branches', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
         const data = await res.json();
         setBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = isEditMode && editingId 
         ? `http://localhost:9000/api/branches/${editingId}`
         : 'http://localhost:9000/api/branches';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ name: '', location: '', status: 'active' });
        setIsEditMode(false);
        setEditingId(null);
        fetchBranches();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save branch' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({ name: '', location: '', status: 'active' });
    setIsEditMode(false);
    setEditingId(null);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setForm({ name: branch.name, location: branch.location || '', status: branch.status || 'active' });
    setIsEditMode(true);
    setEditingId(branch.id);
    setMessage(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    const isActive = (status || 'active') === 'active';
    return (
       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
         isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
       }`}>
         {isActive ? 'active' : 'inactive'}
       </span>
    );
  };

  const activeCount = branches.filter(b => (b.status || 'active') === 'active').length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{branches.length} branches configured — {activeCount} active</p>
        </div>
        <Button onClick={openCreateModal} className="rounded-xl px-6 h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-sm border-0 font-bold transition-all ml-auto sm:ml-0">
          + Add Branch
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
             <div key={i} className="animate-pulse bg-white rounded-3xl border border-slate-100 p-6 h-[250px] shadow-sm">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="mt-8 mb-6 h-10 bg-slate-50 rounded-xl"></div>
                <div className="mt-4 pt-5 border-t border-slate-100 flex justify-between px-2">
                  <div className="h-8 bg-slate-100 rounded w-10"></div>
                  <div className="h-8 bg-slate-100 rounded w-10"></div>
                  <div className="h-8 bg-slate-100 rounded w-10"></div>
                  <div className="h-8 bg-slate-100 rounded w-10"></div>
                </div>
             </div>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm">
           <Building2 className="w-12 h-12 text-slate-300 mb-4" />
           <p className="text-xl font-bold text-slate-900">No branches found</p>
           <p className="text-sm text-slate-500 mt-1 mb-6">Get started by adding your first branch location.</p>
           <Button onClick={openCreateModal} className="rounded-xl px-6 h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
             + Add Branch
           </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {branches.map(branch => {
            const isActive = (branch.status || 'active') === 'active';
            
            return (
              <Card key={branch.id} className={`w-full bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] ${!isActive ? 'opacity-80 bg-slate-50' : ''}`}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between p-5 px-6 gap-6 xl:gap-8">
                  
                  {/* LEFT SECTION */}
                  <div className="flex items-start gap-4 xl:w-1/3">
                    <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-sm mt-1 xl:mt-0">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{branch.name}</h3>
                        {getStatusBadge(branch.status)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-500 text-sm mt-1">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{branch.location || 'Location not specified'}</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]"><span className="font-semibold text-slate-700">{branch.managerName || 'Unassigned'}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER SECTION (Stats) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6 xl:flex-1 w-full xl:w-auto mt-4 xl:mt-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                    <div className="text-center md:border-r border-slate-100 md:pr-4">
                      <p className="text-2xl font-bold text-slate-800">{branch.totalStock || 0}</p>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Total Stock</p>
                    </div>
                    <div className="text-center md:border-r border-slate-100 md:pr-4">
                      <p className="text-2xl font-bold text-slate-800">{branch.productTypes || 0}</p>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Product Types</p>
                    </div>
                    <div className="text-center md:border-r border-slate-100 md:pr-4">
                      <p className="text-2xl font-bold text-orange-600">{branch.nearExpiry || 0}</p>
                      <p className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest mt-1">Near Expiry</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-rose-600">{branch.expired || 0}</p>
                      <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-widest mt-1">Expired</p>
                    </div>
                  </div>

                  {/* RIGHT SECTION */}
                  <div className="flex justify-end items-center mt-4 xl:mt-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                    <button onClick={() => openEditModal(branch)} className="p-2 sm:p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors flex items-center justify-center gap-2" title="Edit Branch">
                      <Edit2 className="w-5 h-5" />
                      <span className="text-sm font-semibold sm:hidden">Edit</span>
                    </button>
                  </div>
                  
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Branch" : "Register New Branch"}>
        <form onSubmit={handleCreateBranch} className="space-y-4 pt-2">
          {message && <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
          <Input label="Branch Name" type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl" />
          <Input label="Physical Location" type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="rounded-xl" />
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button type="submit" disabled={submitLoading} className="w-full mt-8 h-12 rounded-xl shadow-sm text-sm font-bold border-0 bg-teal-600 hover:bg-teal-700 text-white">
            {submitLoading ? 'Saving...' : (isEditMode ? 'Update Branch' : 'Create Branch')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
