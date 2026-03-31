'use client';

import React, { useState } from 'react';
import { PackagePlus, Calendar, Hash, Boxes, User, Store } from 'lucide-react';

export default function BranchStockPage() {
  const [productType, setProductType] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ productType, batchNumber, quantity, expiryDate });
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
          <span className="text-sm font-medium text-slate-500">Today's Entries</span>
          <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold shadow-sm">
            2
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <PackagePlus className="w-6 h-6 text-indigo-600" />
                Record Stock
              </h2>
              <p className="text-slate-500">Log incoming stock for your branch</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <h3 className="font-semibold text-slate-800 text-lg border-b pb-3 border-slate-100">New Stock Entry</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Product Type</label>
                <div className="relative">
                  <select 
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    required
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none font-medium"
                  >
                    <option value="" disabled>Select product...</option>
                    <option value="fresh_milk">Fresh Milk</option>
                    <option value="cheese">Cheese</option>
                    <option value="yogurt">Yogurt</option>
                    <option value="butter">Butter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Batch Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. MLK-2026-010"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="w-full h-12 pl-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Quantity</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Boxes className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder={productType ? "Enter quantity" : "Select product first"}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={!productType}
                      className="w-full h-12 pl-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-text"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Expiry Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="date" 
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-12 pl-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
                >
                  Save Stock Record
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Records Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full min-h-[400px]">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-3 mb-6 border-slate-100">Today's Records</h3>
            
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed h-48">
              <PackagePlus className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No stock recorded yet today...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
