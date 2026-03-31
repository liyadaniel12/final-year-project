import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full p-8 hidden-scrollbar">
        {children}
      </main>
    </div>
  );
}
