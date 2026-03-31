'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system administrators and branch managers.</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setMessage(null); }} className="rounded-xl px-6">
          + Add User
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-0 border-t-4 border-t-indigo-400">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-sm text-slate-500 p-8 text-center">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Account Email</th>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role Assigned</th>
                    <th className="px-6 py-4">Branch ID</th>
                    <th className="px-6 py-4">Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.email}</td>
                      <td className="px-6 py-4 text-slate-600">{u.full_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px] font-bold tracking-wider">
                        <span className={`px-2.5 py-1 rounded-full ${
                          u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                          u.role === 'main_manager' ? 'bg-sky-100 text-sky-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{u.branch_id || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {message && <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
          <Input label="Email Address" type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="rounded-xl" />
          <Input label="Full Name" type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="rounded-xl" />
          <Input label="Temporary Password" type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Leave blank for TempPass123!" className="rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-slate-700">System Role</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="branch_manager">Branch Manager</option>
                <option value="main_manager">Main Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {form.role === 'branch_manager' && (
            <Input label="Target Branch ID (Optional)" type="text" value={form.branchId} onChange={(e) => setForm({...form, branchId: e.target.value})} className="rounded-xl" />
          )}
          <Button type="submit" disabled={submitLoading} className="w-full mt-6 h-11 rounded-xl shadow-sm text-sm font-medium">
            {submitLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
