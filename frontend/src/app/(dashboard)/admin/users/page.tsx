'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, Trash2, Key, Check, X, Shield, MapPin, Loader2, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Core UI Components
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// --- Types ---
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'main_manager' | 'branch_manager';
  status: 'active' | 'inactive';
  branch_id?: string;
  branch_name?: string;
  last_login?: string;
  created_at: string;
}

// --- Schemas ---
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Full name required"),
  role: z.enum(['admin', 'main_manager', 'branch_manager']),
  status: z.enum(['active', 'inactive']),
  branch_id: z.string().optional(),
  password: z.string().optional()
});

type UserFormValues = z.infer<typeof userSchema>;

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Fetch API ---
const fetchUsers = async (): Promise<User[]> => {
  console.log('[fetchUsers] Initiating user fetch...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  console.log('[fetchUsers] Session status:', session ? 'Found' : 'Not found');
  if (!session || sessionError) {
    console.warn('[fetchUsers] User not authenticated or session error:', sessionError);
    throw new Error('User not authenticated');
  }

  console.log('[fetchUsers] Access token available. Making API request to /api/users...');
  const res = await fetch('http://localhost:9000/api/users', {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });

  console.log('[fetchUsers] API Response status:', res.status, res.statusText);

  if (!res.ok) {
    let errorMessage = `Failed to fetch users (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Ignored: fallback to status text
    }
    throw new Error(errorMessage);
  }

  const json = await res.json();
  console.log('[fetchUsers] Response data parsed successfully.', 'Found', json.users?.length || 0, 'users.');
  return json.users || [];
};

// --- Main Page Component ---
export default function UserManagementPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof User>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'branch_manager', status: 'active', email: '', full_name: '' }
  });

  const selectedRole = watch('role');
  const currentId = watch('id');
  const isEditing = !!currentId;

  // React Query
  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Mutations
  const saveUserMut = useMutation({
    mutationFn: async (payload: UserFormValues) => {
      const { data: { session } } = await supabase.auth.getSession();
      const method = payload.id ? 'PUT' : 'POST';
      const url = payload.id ? `http://localhost:9000/api/users/${payload.id}` : 'http://localhost:9000/api/users';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      reset();
      toast.success(isEditing ? 'User updated successfully' : 'User created successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Error occurred')
  });

  const deleteUserMut = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:9000/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
      toast.success('User deleted successfully');
    },
    onError: () => toast.error('Error deleting user')
  });

  const toggleStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:9000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to toggle status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    }
  });

  // Actions
  const handleOpenModal = (user?: User) => {
    if (user) {
      reset({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        branch_id: user.branch_id || ''
      });
    } else {
      reset({ role: 'branch_manager', status: 'active', email: '', full_name: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) return;
    toast.promise(
      Promise.all(Array.from(selectedUsers).map(id => {
        if (action === 'delete') return deleteUserMut.mutateAsync(id);
        return toggleStatusMut.mutateAsync({ id, status: action === 'activate' ? 'active' : 'inactive' });
      })),
      {
        loading: 'Processing bulk action...',
        success: () => {
          setSelectedUsers(new Set());
          return 'Bulk action completed';
        },
        error: 'Error performing bulk action'
      }
    );
  };

  // Filter & Sort
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = debouncedSearch.toLowerCase() === '' ||
        u.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    }).sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: keyof User) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUsers(newSet);
  };

  // Helpers
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'main_manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'branch_manager': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return email.substring(0, 2).toUpperCase();
  };

  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system users, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-medium text-sm border border-slate-100">
            {users.length} users registered
          </div>
          <Button onClick={() => handleOpenModal()} className="rounded-xl px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all">
            + Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
              <option value="all">All Roles</option>
              <option value="admin">System Admin</option>
              <option value="main_manager">Main Manager</option>
              <option value="branch_manager">Branch Manager</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button variant="ghost" className="text-slate-500 hover:text-slate-800 h-9 rounded-xl text-sm px-3" onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedUsers.size > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-800">{selectedUsers.size} users selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-100" onClick={() => handleBulkAction('activate')}>Activate</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-100" onClick={() => handleBulkAction('deactivate')}>Deactivate</Button>
                <Button size="sm" variant="danger" className="h-8 text-xs rounded-lg bg-rose-500 hover:bg-rose-600 border-none" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="pl-6 pr-3 py-4 w-[40px]">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-4 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => toggleSort('full_name')}>
                  <div className="flex items-center gap-1">User <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-4 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => toggleSort('role')}>
                  <div className="flex items-center gap-1">Role <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-4">Branch</th>
                <th className="px-4 py-4 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => toggleSort('last_login')}>
                  <div className="flex items-center gap-1">Last Login <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-4">Status</th>
                <th className="pr-6 pl-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-white">
                    <td className="pl-6 pr-3 py-4"><div className="w-4 h-4 bg-slate-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-200" /><div className="space-y-2"><div className="w-24 h-4 bg-slate-200 rounded" /><div className="w-32 h-3 bg-slate-100 rounded" /></div></div></td>
                    <td className="px-4 py-4"><div className="w-20 h-6 bg-slate-200 rounded-full" /></td>
                    <td className="px-4 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-12 h-6 bg-slate-200 rounded-full" /></td>
                    <td className="pr-6 pl-4 py-4 text-right"><div className="w-8 h-8 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-500">
                      <Shield className="w-10 h-10 text-rose-300 mb-3" />
                      <p className="text-lg font-medium text-rose-900">Failed to load users</p>
                      <p className="text-sm mt-1 mb-4">{error instanceof Error ? error.message : 'An unknown error occurred while fetching user data.'}</p>
                      <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })} variant="secondary" className="border-rose-200 text-rose-700 hover:bg-rose-50 border bg-transparent">Try Again</Button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Search className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-lg font-medium text-slate-900">No users found</p>
                      <p className="text-sm">We couldn't find any users matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                    <td className="pl-6 pr-3 py-4">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked={selectedUsers.has(u.id)} onChange={() => toggleSelect(u.id)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                          {getInitials(u.full_name, u.email)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.full_name || 'Unnamed User'}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleColor(u.role)}`}>
                        <Shield className="w-3 h-3 mr-1 opacity-70" />
                        {u.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {u.role === 'branch_manager' ? (
                        <div className="flex items-center gap-1.5" title={u.branch_id}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.branch_name || u.branch_id || 'Unknown Branch'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">HQ</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {u.last_login ? (
                        <div className="flex flex-col" title={formatDistanceToNow(new Date(u.last_login), { addSuffix: true })}>
                          <span>{format(new Date(u.last_login), 'MMM dd, hh:mm a')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleStatusMut.mutate({ id: u.id, status: u.status === 'active' ? 'inactive' : 'active' })}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        role="switch" aria-checked={u.status === 'active'}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${u.status === 'active' ? 'translate-x-2' : '-translate-x-2'}`} />
                      </button>
                    </td>
                    <td className="pr-6 pl-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors" title="Edit User">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 transition-colors" title="Reset Password" onClick={() => toast.info('Password reset link sent to ' + u.email)}>
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setUserToDelete(u); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit User' : 'Register New User'}>
        <form onSubmit={handleSubmit((d) => saveUserMut.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Input label="Full Name" {...register('full_name')} className={`rounded-xl ${errors.full_name ? 'border-rose-300 focus:ring-rose-500' : ''}`} placeholder="John Doe" />
            {errors.full_name && <p className="text-xs text-rose-500">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1">
            <Input label="Email Address" type="email" {...register('email')} className={`rounded-xl ${errors.email ? 'border-rose-300 focus:ring-rose-500' : ''}`} placeholder="john@example.com" disabled={isEditing} />
            {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
          </div>

          {!isEditing && (
            <div className="space-y-1">
              <Input label="Password" type="password" {...register('password')} className="rounded-xl" placeholder="Leave blank to auto-generate" />
              <p className="text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Minimum 8 characters recommended</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">System Role</label>
              <select {...register('role')} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="branch_manager">Branch Manager</option>
                <option value="main_manager">Main Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select {...register('status')} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

  {
    selectedRole === 'branch_manager' && (
      <div className="space-y-1">
        <Input label="Assigned Branch ID" {...register('branch_id')} className="rounded-xl" placeholder="branch_uuid_here" />
      </div>
    )
  }

  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl h-10 px-4">Cancel</Button>
    <Button type="submit" disabled={saveUserMut.isPending} className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
      {saveUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Save Changes' : 'Create User')}
    </Button>
  </div>
        </form >
      </Modal >

    {/* Delete Confirmation Modal */ }
    < Modal isOpen = { isDeleteModalOpen } onClose = {() => setIsDeleteModalOpen(false)
} title = "Delete User" >
  <div className="space-y-4">
    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-3 text-rose-800">
      <Trash2 className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-bold mb-1">Warning: Irreversible Action</p>
        <p>You are about to permanently delete the user <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email}). This action cannot be undone.</p>
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Type <span className="font-mono font-bold select-all bg-slate-100 px-1 rounded">{userToDelete?.email}</span> to confirm:
      </label>
      <Input
        value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
        className="rounded-xl focus:ring-rose-500/20 focus:border-rose-500" placeholder={userToDelete?.email}
      />
    </div>

    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
      <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl h-10 px-4">Cancel</Button>
      <Button
        disabled={deleteConfirmText !== userToDelete?.email || deleteUserMut.isPending}
        onClick={() => userToDelete && deleteUserMut.mutate(userToDelete.id)}
        className="rounded-xl h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
      >
        {deleteUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Permanently Delete'}
      </Button>
    </div>
  </div>
      </Modal >

    </div >
  );
}
