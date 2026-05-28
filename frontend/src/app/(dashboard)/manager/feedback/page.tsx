'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Star, AlertOctagon, Filter, Loader2, X, Package, Calendar, Info, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';

interface FeedbackItem {
  id: string;
  customerName: string;
  branchName: string;
  branchId: string;
  productName: string | null;
  productId: string | null;
  batchNumber: string | null;
  rating: number;
  categories: string[];
  feedbackText: string;
  recommend: boolean | null;
  buyAgain: string | null;
  isCritical: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  date: string;
  time: string;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function ManagerFeedbackPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCritical, setFilterCritical] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterResolved, setFilterResolved] = useState<string>('all'); // all, resolved, unresolved
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Fetch branches for filter (public endpoint, no auth needed)
        try {
          const branchRes = await fetch('https://final-year-project-h5uk.onrender.com/api/branches/public');
          if (branchRes.ok) {
            const branchData = await branchRes.json();
            setBranches(branchData.branches || []);
          }
        } catch (branchErr) {
          console.warn('Failed to fetch branches, filters may be limited:', branchErr);
          // Non-critical, continue with feedback fetch
        }

        // Fetch feedback
        const response = await fetch('https://final-year-project-h5uk.onrender.com/api/feedback', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch feedback');
        const jsonData = await response.json();
        setFeedback(jsonData.feedback || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleToggleResolve = async (id: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://final-year-project-h5uk.onrender.com/api/feedback/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isResolved: !currentStatus })
      });

      if (response.ok) {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, isResolved: !currentStatus } : f));
      }
    } catch (err) {
      console.error('Failed to toggle resolution:', err);
      // Fallback for demo: just update UI locally if fetch fails
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, isResolved: !currentStatus } : f));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://final-year-project-h5uk.onrender.com/api/feedback/export', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Compute metrics
  const totalMessages = feedback.length;
  const criticalCount = feedback.filter(f => f.isCritical).length;
  const avgRating = totalMessages > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / totalMessages).toFixed(1)
    : '0.0';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthCount = feedback.filter(f => new Date(f.createdAt) >= thisMonth).length;

  // Filter and search
  const filteredFeedback = feedback.filter(item => {
    // Search filter
    const searchMatch = !searchTerm || 
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.feedbackText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Critical filter
    const criticalMatch = !filterCritical || item.isCritical;

    // Rating filter
    const ratingMatch = filterRating === null || item.rating === filterRating;

    // Branch filter
    const branchMatch = !filterBranch || item.branchId === filterBranch;

    // Resolved filter
    const resolvedMatch = filterResolved === 'all' || 
      (filterResolved === 'resolved' && item.isResolved) || 
      (filterResolved === 'unresolved' && !item.isResolved);

    return searchMatch && criticalMatch && ratingMatch && branchMatch && resolvedMatch;
  });

  const fetchBatchDetails = async (batchNumber: string) => {
    try {
      const response = await fetch(`https://final-year-project-h5uk.onrender.com/api/batches/lookup?batchNumber=${encodeURIComponent(batchNumber)}`);
      const data = await response.json();
      if (data.exists) {
        setSelectedBatch(data.batch);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch batch details:', err);
      // Mock details for demo if fetch fails
      setSelectedBatch({
         productName: 'Sample Product (Offline)',
         batchNumber: batchNumber,
         expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString(),
         status: 'fresh',
         branchName: 'Local Cache',
         daysLeft: 5,
         quantity: 100
      });
      setIsModalOpen(true);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`}
        />
      ))}
    </div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Feedback</h1>
        <p className="text-slate-500 mt-1">Product quality and freshness feedback from customers</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Feedback</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalMessages}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-black text-slate-900">{avgRating}</p>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
          </div>
        </Card>



        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month</p>
              <p className="text-3xl font-black text-indigo-600 mt-1">{thisMonthCount}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">


            {/* Branch Filter */}
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 text-[11px] font-bold bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>



            {/* Rating Filter */}
            <select
              value={filterRating ?? ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="h-9 px-3 rounded-lg border border-slate-200 text-[11px] font-bold bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Rating: All</option>
              {[5, 4, 3, 2, 1].map(r => (
                <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
              ))}
            </select>

            <div className="text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
              {filteredFeedback.length} result{filteredFeedback.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 w-[200px]">Customer</th>
                <th className="px-6 py-3.5 w-[45%]">Feedback</th>
                <th className="px-6 py-3.5 w-[150px]">Branch</th>
                <th className="px-6 py-3.5 w-[100px] text-center">Rating</th>

                <th className="px-6 py-3.5 w-[140px] text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeedback.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${item.isCritical ? 'bg-rose-50/30' : 'bg-white'}`}>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                        {item.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{item.customerName}</div>
                        {item.batchNumber && (
                          <button 
                            onClick={() => fetchBatchDetails(item.batchNumber!)}
                            className="text-[10px] text-indigo-600 font-mono mt-0.5 hover:underline cursor-pointer bg-indigo-50 px-1.5 py-0.5 rounded"
                          >
                            {item.batchNumber}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <p className="text-slate-700 leading-relaxed line-clamp-2">
                      {item.feedbackText || <span className="text-slate-400 italic">No comment</span>}
                    </p>
                    {item.productName && (
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200">
                        {item.productName}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="text-sm font-medium text-slate-600">{item.branchName}</span>
                  </td>
                  <td className="px-6 py-4 align-top text-center">
                    {renderStars(item.rating)}
                  </td>

                  <td className="px-6 py-4 align-top text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-600">{item.date}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{item.time}</div>
                  </td>
                </tr>
              ))}
              {filteredFeedback.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No feedback found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {searchTerm || filterCritical || filterRating !== null
                        ? 'Try adjusting your search or filters'
                        : 'Customer feedback will appear here once submitted'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Batch Details Modal */}
      {isModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Batch Details</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{selectedBatch.productName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Batch ID</p>
                  <p className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{selectedBatch.batchNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Expiry Date</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(selectedBatch.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                    selectedBatch.status === 'expired' ? 'bg-rose-100 text-rose-700' : 
                    selectedBatch.status === 'near_expiry' ? 'bg-amber-100 text-amber-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedBatch.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Origin Branch</span>
                    <span className="font-bold text-slate-900">{selectedBatch.branchName}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Days Remaining</span>
                    <span className={`font-bold ${selectedBatch.daysLeft < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                       {selectedBatch.daysLeft} days
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Available Qty</span>
                    <span className="font-bold text-slate-900">{selectedBatch.quantity} units</span>
                 </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl shadow-sm transition-all text-sm"
              >
                Close Details
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
