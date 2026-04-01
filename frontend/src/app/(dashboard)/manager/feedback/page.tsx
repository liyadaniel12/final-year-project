'use client';

import React, { useState } from 'react';
import { Search, MessageSquare, ArrowRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const mockFeedback = [
  { id: 1, initial: 'S', customer: 'Sarah J.', branch: 'Branch A', message: 'Very fresh, perfect quality! Received well before expiry. Will buy again.', date: '2026-03-25' },
  { id: 2, initial: 'T', customer: 'Tom R.', branch: 'Branch A', message: 'Good quality yogurt, slight sourness indicating it was nearing expiry but still acceptable.', date: '2026-03-24' },
  { id: 3, initial: 'M', customer: 'Mia C.', branch: 'Branch B', message: 'Excellent freshness. Packaging was intact and expiry date clearly marked. Great product!', date: '2026-03-23' },
  { id: 4, initial: 'D', customer: 'David L.', branch: 'Branch C', message: 'Purchased milk that had already expired. Very disappointed. This should not be on the shelf.', date: '2026-03-25' },
  { id: 5, initial: 'A', customer: 'Aisha M.', branch: 'Branch E', message: 'Always fresh! Love the long shelf life and consistent quality from this branch.', date: '2026-03-22' },
  { id: 6, initial: 'C', customer: 'Carlos V.', branch: 'Branch B', message: 'Product was okay but I noticed it was close to expiry. Consider better stock rotation.', date: '2026-03-23' },
  { id: 7, initial: 'Y', customer: 'Yuki T.', branch: 'Branch B', message: 'Perfect! Very fresh and well within expiry date. The batch verification feature is very helpful.', date: '2026-03-24' },
  { id: 8, initial: 'K', customer: 'Kemal A.', branch: 'Branch C', message: 'Good quality overall, delivered fresh. Batch verification gave me confidence.', date: '2026-03-21' },
  { id: 9, initial: 'N', customer: 'Nora K.', branch: 'Branch E', message: 'Best butter I have had. Consistent freshness every time I buy from Branch E.', date: '2026-03-20' }
];

export default function CustomerFeedbackPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Feedback</h1>
          <p className="text-slate-500 mt-1">Direct product quality and freshness feedback</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6 flex items-center justify-between hover:border-indigo-200 transition-colors cursor-default">
          <div className="space-y-1">
            <h3 className="text-slate-500 font-medium text-sm tracking-wide uppercase">Total Messages</h3>
            <p className="text-4xl font-bold text-slate-900">9</p>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
            <MessageSquare className="w-8 h-8" />
          </div>
        </Card>
        
        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6 flex items-center justify-between hover:border-indigo-200 transition-colors cursor-default">
          <div className="space-y-1">
            <h3 className="text-slate-500 font-medium text-sm tracking-wide uppercase">This Month</h3>
            <p className="text-4xl font-bold text-indigo-600">9</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
            <MessageSquare className="w-8 h-8" />
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6 flex items-center justify-between hover:border-emerald-200 transition-colors cursor-default">
          <div className="space-y-1">
            <h3 className="text-slate-500 font-medium text-sm tracking-wide uppercase">Today</h3>
            <p className="text-4xl font-bold text-emerald-600">2</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-500">
            <MessageSquare className="w-8 h-8" />
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative max-w-lg w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by customer, message, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-white w-full"
            />
          </div>
          
          <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            9 messages
          </div>
        </div>
        
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            All Feedback
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold w-[250px]">Customer</th>
                <th className="px-6 py-4 font-semibold">Message</th>
                <th className="px-6 py-4 font-semibold text-right w-[150px]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockFeedback.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors items-start">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                        {item.initial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.customer}</div>
                        <div className="text-xs text-slate-500 font-medium inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 mt-1">
                          {item.branch}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <p className="text-slate-700 leading-relaxed font-medium">"{item.message}"</p>
                  </td>
                  <td className="px-6 py-5 align-top text-right whitespace-nowrap">
                    <span className="text-slate-500 font-medium">{item.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
