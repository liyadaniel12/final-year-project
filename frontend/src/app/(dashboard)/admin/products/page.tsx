// app/admin/products/page.tsx - CLEAN VERSION

'use client';

import { useState, useEffect } from 'react';

// FIXED PRODUCT DATA - ONLY 4 PRODUCTS
const FIXED_PRODUCTS = [
  { 
    id: '1', 
    name: 'fresh_milk', 
    displayName: 'Fresh Milk', 
    image: '/images/milk.jpg',
    unit: 'Liters (L)', 
    shelfLifeDays: 1, 
    shelfLifeText: '1 day',
    isActive: true,
    order: 1
  },
  { 
    id: '2', 
    name: 'yogurt', 
    displayName: 'Yogurt', 
    image: '/images/yogurt.jpg',
    unit: 'Grams (g)', 
    shelfLifeDays: 7, 
    shelfLifeText: '7 days',
    isActive: true,
    order: 2
  },
  { 
    id: '3', 
    name: 'cheese', 
    displayName: 'Cheese', 
    image: '/images/cheese.jpg',
    unit: 'Grams (g)', 
    shelfLifeDays: 60, 
    shelfLifeText: '60 days',
    isActive: true,
    order: 3
  },
  { 
    id: '4', 
    name: 'butter', 
    displayName: 'Butter', 
    image: '/images/butter.jpg',
    unit: 'Kilograms (kg)', 
    shelfLifeDays: 90, 
    shelfLifeText: '90 days',
    isActive: true,
    order: 4
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState(FIXED_PRODUCTS);
  const [loading, setLoading] = useState(false);

  // Sort by shelfLifeDays (1, 7, 60, 90)
  const sortedProducts = [...products].sort((a, b) => a.shelfLifeDays - b.shelfLifeDays);

  const handleToggle = async (productId: string) => {
    setLoading(true);
    setProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, isActive: !p.isActive }
          : p
      )
    );
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          4 registered product types — fixed shelf life values
        </p>
      </div>

      {/* PRODUCT CARDS - GRID LAYOUT (4 cards in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className={`rounded-xl p-5 shadow-md border transition-all ${
              product.isActive 
                ? 'bg-white border-gray-200 hover:shadow-lg' 
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="text-center">
              {/* Product Image */}
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center">
                <img src={product.image} alt={product.displayName} className="w-full h-full object-cover" />
              </div>
              
              {/* Product Name */}
              <h3 className="font-bold text-xl text-gray-800">
                {product.displayName}
              </h3>
              
              {/* Unit */}
              <p className="text-sm text-gray-500 mt-1">{product.unit}</p>
              
              {/* Shelf Life - Highlight Fresh Milk */}
              <p className={`text-2xl font-bold mt-3 ${
                product.shelfLifeDays === 1 ? 'text-red-600' : 'text-gray-700'
              }`}>
                {product.shelfLifeText}
              </p>
              
              {/* Fixed Badge */}
              <div className="mt-3">
                <span className="text-xs text-gray-400">🔒 Fixed Shelf Life</span>
              </div>
              

            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT TABLE - WITH TOGGLE BUTTONS */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Product Registry</h3>
          <p className="text-xs text-gray-500 mt-1">
            Manage product status below. Toggle to activate/deactivate products system-wide.
          </p>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shelf Life
              </th>

            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <tr key={product.id} className={!product.isActive ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
                      <img src={product.image} alt={product.displayName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.displayName}</div>
                      <div className="text-xs text-gray-500">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{product.unit}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-mono ${
                    product.shelfLifeDays === 1 
                      ? 'bg-red-100 text-red-700 font-bold' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {product.shelfLifeText}
                    <span className="text-xs text-gray-400 ml-1">(FIXED)</span>
                  </span>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INFO BANNER */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium">About Product Management</p>
            <p className="text-blue-700 mt-1">
              • <strong>Active</strong> products appear in stock recording, sales, and redistribution forms.<br />
              • <strong>Inactive</strong> products are hidden system-wide and cannot be used.<br />
              • Shelf life values are <strong>fixed</strong> and cannot be changed for data integrity.<br />
              • Fresh Milk has <strong>1 day</strong> shelf life - must be sold on production day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
