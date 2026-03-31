'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('branch_manager');
  const [branchId, setBranchId] = useState('');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('http://localhost:9000/api/users', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
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
        email,
        password: password || undefined,
        role,
        branch_id: branchId || undefined
      };

      const res = await fetch('http://localhost:9000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'User created successfully!' });
        setEmail('');
        setPassword('');
        setBranchId('');
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
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create User Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}
              
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input
                label="Default Password (Optional)"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="TempPass123!"
              />
              
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="branch_manager">Branch Manager</option>
                  <option value="main_manager">Main Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(role === 'branch_manager') && (
                <Input
                  label="Branch ID (Optional)"
                  type="text"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                />
              )}

              <Button type="submit" disabled={submitLoading} className="w-full">
                {submitLoading ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>System Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-slate-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-slate-500">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Branch ID</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.email}</td>
                        <td className="px-4 py-3 uppercase text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                            u.role === 'main_manager' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{u.branch_id || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
