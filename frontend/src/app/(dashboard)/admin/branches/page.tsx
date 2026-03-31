'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabaseClient';
import { Edit2, MapPin, User, Package, Layers, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<any[]>([]);
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

  const openEditModal = (branch: any) => {
    setForm({ name: branch.name, location: branch.location || '', status: branch.status || 'active' });
    setIsEditMode(true);
    setEditingId(branch.id);
    setMessage(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const isActive = (status || 'active') === 'active';
    return (
       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${
         isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
       }`}>
         {isActive ? 'active' : 'inactive'}
       </span>
    );
  };

  const activeCount = branches.filter(b => (b.status || 'active') === 'active').length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Management</h1>
          <p className="text-slate-500 mt-1 font-medium">{branches.length} branches configured — {activeCount} active</p>
        </div>
        <Button onClick={openCreateModal} variant="secondary" className="rounded-xl px-6 h-12 shadow-sm">
          + Add Branch
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 p-8 text-center animate-pulse">Loading branches...</div>
      ) : branches.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100">
           <p className="text-slate-500">No branches found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map(branch => {
            const isActive = (branch.status || 'active') === 'active';
            
            return (
              <Card key={branch.id} className={`rounded-3xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md ${!isActive ? 'opacity-80 bg-slate-50' : 'bg-white'}`}>
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                     <div className="space-y-1 relative pr-8">
                       <h3 className="text-xl font-bold text-slate-900 leading-tight">{branch.name}</h3>
                       <div>{getStatusBadge(branch.status)}</div>
                     </div>
                     <button onClick={() => openEditModal(branch)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors absolute sm:static" aria-label="Edit Branch">
                       <Edit2 className="w-4 h-4" />
                     </button>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-3 mb-6">
                     <div className="flex items-center text-slate-600">
                       <MapPin className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                       <span className="text-sm font-medium">{branch.location || 'Location not specified'}</span>
                     </div>
                     <div className="flex items-center text-slate-600">
                       <User className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                       <span className="text-sm font-medium">Manager: <span className="font-semibold text-slate-800">{branch.managerName}</span></span>
                     </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                     <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                           <Package className="w-3.5 h-3.5" />
                           <span className="text-xs font-semibold uppercase tracking-wider">Total Stock</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{branch.totalStock || 0}</p>
                     </div>
                     
                     <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                           <Layers className="w-3.5 h-3.5" />
                           <span className="text-xs font-semibold uppercase tracking-wider">Product Types</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{branch.productTypes || 0}</p>
                     </div>

                     <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                           <AlertTriangle className="w-3.5 h-3.5" />
                           <span className="text-xs font-semibold uppercase tracking-wider">Near Expiry</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">{branch.nearExpiry || 0}</p>
                     </div>

                     <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                           <AlertOctagon className="w-3.5 h-3.5" />
                           <span className="text-xs font-semibold uppercase tracking-wider">Expired</span>
                        </div>
                        <p className="text-2xl font-bold text-rose-700">{branch.expired || 0}</p>
                     </div>
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
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button type="submit" disabled={submitLoading} className="w-full mt-8 h-12 rounded-xl shadow-sm text-sm font-bold border-0" variant="secondary">
            {submitLoading ? 'Saving...' : (isEditMode ? 'Update Branch' : 'Create Branch')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
