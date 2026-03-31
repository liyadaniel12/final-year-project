'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, AlertTriangle } from 'lucide-react';

export default function ManagerDashboard() {
  // Mock data for now
  const mockTableData = [
    { id: 1, name: 'Premium Milk', sku: 'MILK-001', stock: 1500, status: 'In Stock' },
    { id: 2, name: 'Cheddar Cheese', sku: 'CHS-012', stock: 450, status: 'In Stock' },
    { id: 3, name: 'Greek Yogurt', sku: 'YOG-005', stock: 80, status: 'Low Stock' },
    { id: 4, name: 'Butter', sku: 'BTR-002', stock: 12, status: 'Near Expiry' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manager Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Stock Items</p>
              <h3 className="text-2xl font-bold text-slate-900">2,042</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Near Expiry Products</p>
              <h3 className="text-2xl font-bold text-slate-900">12</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Stock Level</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTableData.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500">{item.sku}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.stock}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
