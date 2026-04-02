'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ArrowRight, User, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

export default function CustomerFeedbackPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) return;

        const response = await fetch('http://localhost:9000/api/manager/feedback', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }

        const jsonData = await response.json();
        setFeedback(jsonData.feedback || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  // Compute metrics
  const totalMessages = feedback.length;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const messagesToday = feedback.filter(f => new Date(f.date) >= today).length;
  const messagesThisMonth = feedback.filter(f => new Date(f.date) >= thisMonth).length;

  const filteredFeedback = feedback.filter(item => 
    item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-rose-500 font-medium">
        Error loading feedback: {error}
      </div>
    );
  }

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
            <p className="text-4xl font-bold text-slate-900">{totalMessages}</p>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
            <MessageSquare className="w-8 h-8" />
          </div>
        </Card>
        
        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6 flex items-center justify-between hover:border-indigo-200 transition-colors cursor-default">
          <div className="space-y-1">
            <h3 className="text-slate-500 font-medium text-sm tracking-wide uppercase">This Month</h3>
            <p className="text-4xl font-bold text-indigo-600">{messagesThisMonth}</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
            <MessageSquare className="w-8 h-8" />
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6 flex items-center justify-between hover:border-emerald-200 transition-colors cursor-default">
          <div className="space-y-1">
            <h3 className="text-slate-500 font-medium text-sm tracking-wide uppercase">Today</h3>
            <p className="text-4xl font-bold text-emerald-600">{messagesToday}</p>
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
            {filteredFeedback.length} messages
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
              {filteredFeedback.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors items-start">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                        {item.initial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.customer}</div>
                        <div className="text-xs text-slate-500 font-medium inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 mt-1">
                          ★ {item.rating} / 5 | {item.product} ({item.batch})
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
              {filteredFeedback.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-medium italic">
                    No customer feedback received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
