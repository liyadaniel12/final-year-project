'use client';

import React, { useState } from 'react';
import { ShoppingCart, Boxes, Store, User, Clock, AlertCircle } from 'lucide-react';

export default function BranchSalesPage() {
  const [batch, setBatch] = useState('');
  const [quantity, setQuantity] = useState('');

  const currentBatches = [
    { product: 'Fresh Milk', batch: 'MLK-2026-001', qty: '120 L', daysLeft: 2 },
    { product: 'Yogurt', batch: 'YGT-2026-045', qty: '40,000 g', daysLeft: 4 },
    { product: 'Cheese', batch: 'CHS-2026-012', qty: '11.25 kg', daysLeft: 17 },
    { product: 'Butter', batch: 'BTR-2026-033', qty: '6 kg', daysLeft: 69 },
  ];

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ batch, quantity });
    // TODO: submit to backend
  };

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Branch A</h1>
            <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 text-sm">
              <User className="w-4 h-4" />
              Omar Khalid
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500">Today's Sales</span>
          <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold shadow-sm">
            2
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
                Update Sales
              </h2>
              <p className="text-slate-500">Record sold quantities — stock updates automatically</p>
            </div>

            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-100 flex items-center gap-3 mb-6 font-medium text-sm">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              Please select a product.
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <h3 className="font-semibold text-slate-800 text-lg border-b pb-3 border-slate-100">Record Sale</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Select Product Batch</label>
                <div className="relative">
                  <select 
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    required
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none font-medium"
                  >
                    <option value="" disabled>Choose product batch...</option>
                    {currentBatches.map(b => (
                      <option key={b.batch} value={b.batch}>{b.product} ({b.batch})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Quantity Sold</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Boxes className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="Enter quantity sold..."
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={!batch}
                    className="w-full h-12 pl-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-text"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
                >
                  Update Sales
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Current Batch Levels Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-3 mb-5 border-slate-100">Current Batch Levels</h3>
            
            <div className="space-y-4">
              {currentBatches.map((item, index) => (
                <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.product}</h4>
                      <p className="text-xs font-medium text-slate-500">{item.batch}</p>
                    </div>
                    <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 border-t border-slate-100 pt-2">
                    <Clock className={`w-3.5 h-3.5 ${item.daysLeft <= 3 ? 'text-red-500' : 'text-emerald-500'}`} />
                    <span className={`text-xs font-bold ${item.daysLeft <= 3 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.daysLeft}d left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
