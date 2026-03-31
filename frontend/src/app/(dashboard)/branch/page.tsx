'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Store, ShoppingCart } from 'lucide-react';

export default function BranchDashboard() {
  const [productCode, setProductCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Mock data for current stock
  const currentStock = [
    { id: 1, name: 'Premium Milk 1L', skus: 'MILK-001', stock: 120 },
    { id: 2, name: 'Cheddar Cheese 500g', skus: 'CHS-012', stock: 45 },
    { id: 3, name: 'Butter 250g', skus: 'BTR-002', stock: 8 },
  ];

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Simulate API call
    setTimeout(() => {
      setMessage({ type: 'success', text: `Successfully processed sale for ${quantity} items.` });
      setProductCode('');
      setQuantity('1');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branch Operations</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Record Sale</CardTitle>
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSale} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}
              
              <Input
                label="Product Code / SKU"
                type="text"
                required
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="e.g. MILK-001"
              />
              
              <Input
                label="Quantity"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Complete Sale'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Stock */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Current Branch Stock</CardTitle>
            <Store className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Available Stock</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStock.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.skus}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.stock}</td>
                      <td className="px-4 py-3 text-center">
                        {item.stock > 20 ? (
                           <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">Healthy</span>
                        ) : item.stock > 0 ? (
                           <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">Low</span>
                        ) : (
                           <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Out</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
