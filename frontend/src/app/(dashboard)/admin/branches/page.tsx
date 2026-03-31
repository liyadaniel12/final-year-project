'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabaseClient';

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
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
      if (res.ok) setBranches((await res.json()).branches || []);
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
      const res = await fetch('http://localhost:9000/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ name: '', location: '', status: 'active' });
        fetchBranches();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create branch' });
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Management</h1>
          <p className="text-slate-500 mt-1">Manage and add operational warehouse and retail branches.</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setMessage(null); }} variant="secondary" className="rounded-xl px-6">
          + Add Branch
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-0 border-t-4 border-t-teal-400">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-sm text-slate-500 p-8 text-center">Loading branches...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Branch Name</th>
                    <th className="px-6 py-4">Physical Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Established</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No branches found.</td></tr>
                  ) : branches.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{b.name}</td>
                      <td className="px-6 py-4 text-slate-500">{b.location || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {b.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Branch">
        <form onSubmit={handleCreateBranch} className="space-y-4">
          {message && <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
          <Input label="Branch Name" type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl" />
          <Input label="Physical Location" type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="rounded-xl" />
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button type="submit" disabled={submitLoading} className="w-full mt-6 h-11 rounded-xl shadow-sm text-sm font-medium border-0" variant="secondary">
            {submitLoading ? 'Registering...' : 'Create Branch'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
