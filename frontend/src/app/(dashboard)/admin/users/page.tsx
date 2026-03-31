'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabaseClient';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'branch_manager', status: 'active', branchId: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:9000/api/users', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) setUsers((await res.json()).users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        email: form.email,
        full_name: form.full_name,
        password: form.password || undefined,
        role: form.role,
        status: form.status,
        branch_id: form.branchId || undefined
      };

      const res = await fetch('http://localhost:9000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ email: '', full_name: '', password: '', role: 'branch_manager', status: 'active', branchId: '' });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1 font-medium">{users.length} total users — {activeCount} active status</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setMessage(null); }} variant="secondary" className="rounded-xl px-6 h-12 shadow-sm">
          + Add User
        </Button>
      </div>

      <Card className="rounded-3xl shadow-sm border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-sm text-slate-500 p-12 text-center animate-pulse">Loading users...</div>
          ) : users.length === 0 ? (
             <div className="text-center p-12">
               <p className="text-slate-500">No users found.</p>
             </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 rounded-tl-3xl">Account Email</th>
                  <th className="px-6 py-5">Full Name</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Role Assigned</th>
                  <th className="px-6 py-5">Branch ID</th>
                  <th className="px-6 py-5 text-right rounded-tr-3xl">Join Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-900">{u.email}</td>
                    <td className="px-6 py-5 text-slate-600 font-medium">{u.full_name || '-'}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-5 uppercase text-[10px] font-bold tracking-wider">
                      <span className={`px-2.5 py-1 rounded-full border ${
                        u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        u.role === 'main_manager' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500">{u.branch_id || '-'}</td>
                    <td className="px-6 py-5 text-slate-500 font-medium text-right">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New User">
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          {message && <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
          <Input label="Email Address" type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="rounded-xl" />
          <Input label="Full Name" type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="rounded-xl" />
          <Input label="Temporary Password" type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Leave blank for TempPass123!" className="rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-slate-700 mb-1">System Role</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium">
                <option value="branch_manager">Branch Manager</option>
                <option value="main_manager">Main Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {form.role === 'branch_manager' && (
            <Input label="Target Branch ID (Optional)" type="text" value={form.branchId} onChange={(e) => setForm({...form, branchId: e.target.value})} className="rounded-xl" />
          )}
          <Button type="submit" disabled={submitLoading} className="w-full mt-8 h-12 rounded-xl shadow-sm text-sm font-bold border-0" variant="secondary">
            {submitLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
