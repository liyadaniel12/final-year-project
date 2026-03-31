'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { LayoutDashboard, Users, LogOut, Package, Store, FileText, Component, AlertTriangle, MessageSquare, ArrowRightLeft, LineChart } from 'lucide-react';
import { cn } from '../ui/Button';

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = (() => {
    switch (user.role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Overview', icon: LayoutDashboard },
          { href: '/admin/users', label: 'User Management', icon: Users },
          { href: '/admin/branches', label: 'Branch Management', icon: Store },
          { href: '/admin/products', label: 'Product Management', icon: Package },
        ];
      case 'main_manager':
        return [
          { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/manager/stock', label: 'Stock Overview', icon: Package },
          { href: '/manager/expiry', label: 'Expiry Analysis', icon: AlertTriangle },
          { href: '/manager/redistribution', label: 'Redistribution', icon: ArrowRightLeft },
          { href: '/manager/feedback', label: 'Customer Feedback', icon: MessageSquare },
          { href: '/manager/reports', label: 'Generate Reports', icon: FileText },
        ];
      case 'branch_manager':
        return [
          { href: '/branch', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/branch/stock', label: 'Stock', icon: Package },
          { href: '/branch/sales', label: 'Sales', icon: LineChart },
          { href: '/branch/expiry', label: 'Expiry', icon: AlertTriangle },
          { href: '/branch/transfer', label: 'Transfer', icon: ArrowRightLeft },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-lg">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold">DairySystem</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col space-y-1 px-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-white">{user.email}</p>
          <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
