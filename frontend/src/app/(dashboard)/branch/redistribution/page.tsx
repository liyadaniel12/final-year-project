'use client';

import React, { useState, useEffect } from 'react';
import { Truck, ArrowRight, CheckCircle2, AlertCircle, XCircle, Loader2, ArrowRightLeft, Store, User as UserIcon, Send, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

export default function BranchRedistributionPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('Your Branch');

  // Form states
  const [activeTab, setActiveTab] = useState<'send' | 'request'>('send');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('');
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);

  const fetchTransfers = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) return;

      const response = await fetch('http://localhost:9000/api/branch-manager/transfers', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transfers');
      const jsonData = await response.json();
      setTransfers(jsonData.transfers || []);

      if (user?.branch_id) {
        const { data: branchData } = await supabase.from('branches').select('name').eq('id', user.branch_id).single();
        if (branchData) setBranchName(branchData.name);
      }
    } catch (err: any) {
      console.error("Transfers error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const response = await fetch('http://localhost:9000/api/branch-manager/transfer-options', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
  }, [user]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`http://localhost:9000/api/branch-manager/transfers/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Update failed');
      }
      toast.success(`Request marked as ${status}`);
      await fetchTransfers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      fetchRecommendations(selectedProduct, activeTab);
    } else {
      setRecommendations([]);
      setSelectedBranch('');
    }
  }, [selectedProduct, activeTab]);

  const fetchRecommendations = async (productId: string, mode: string) => {
    setRecsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`http://localhost:9000/api/branch-manager/transfer-options?product_id=${productId}&mode=${mode}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        if (data.recommendations && data.recommendations.length > 0) {
           setSelectedBranch(data.recommendations[0].branch_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleTabSwitch = (tab: 'send' | 'request') => {
    setActiveTab(tab);
    setSelectedProduct('');
    setQuantity('');
    setReason('');
    setUrgency('');
    setSelectedBranch('');
    setRecommendations([]);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!selectedBranch) {
      toast.error('Please select a recommended branch.');
      return;
    }

    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const payload = {
        from_branch_id: activeTab === 'send' ? user?.branch_id : selectedBranch,
        to_branch_id: activeTab === 'send' ? selectedBranch : user?.branch_id,
        product_id: selectedProduct,
        quantity: Number(quantity),
        reason: activeTab === 'send' ? reason : undefined,
        urgency: activeTab === 'request' ? urgency : undefined
      };

      const res = await fetch('http://localhost:9000/api/branch-manager/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());
      
      toast.success(activeTab === 'send' ? 'Redistribution request sent successfully' : 'Stock request sent successfully');
      
      // Reset form
      setSelectedProduct('');
      setQuantity('');
      setReason('');
      setUrgency('');
      setSelectedBranch('');
      
      await fetchTransfers();
    } catch(e) {
      console.error(e);
      toast.error('Failed to submit request');
    } finally {
      setIsSending(false);
    }
  };

  const pendingInbound = transfers.filter(t => t.direction === 'Inbound' && t.status === 'Pending');
  const allOtherTransfers = transfers.filter(t => !(t.direction === 'Inbound' && t.status === 'Pending'));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Accepted': return 'text-sky-600 bg-sky-50 border-sky-200';
      case 'In-transit': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'Completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Rejected': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'In-transit': return <Truck className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'Pending': return <AlertCircle className="w-4 h-4" />;
      default: return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Profile Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg border border-indigo-100">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">{branchName}</h2>
            <p className="text-xs text-slate-500 font-medium">{user?.email || 'Branch Manager'}</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-lg font-bold text-slate-700">
          {pendingInbound.length}
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Redistribution & Requests</h1>
        <p className="text-slate-500 font-medium pb-2 border-b border-slate-200">Manage stock movement between branches</p>
      </div>

      {/* Action Forms Area */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button 
            type="button"
            onClick={() => handleTabSwitch('send')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-colors ${activeTab === 'send' ? 'bg-indigo-50/50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <ArrowUpFromLine className="w-4 h-4" /> Send Redistribution Request
          </button>
          <button 
            type="button"
            onClick={() => handleTabSwitch('request')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-colors ${activeTab === 'request' ? 'bg-emerald-50/50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <ArrowDownToLine className="w-4 h-4" /> Request Stock
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'send' ? 'Redistribute Excess Stock' : 'Request Needed Stock'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'send' 
                ? 'Send stock to branches that need it. The system recommends branches with low stock.' 
                : 'Request stock from other branches. The system recommends branches with high stock or near-expiry items.'}
            </p>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                  required
                >
                  <option value="">-- Choose a product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity {activeTab === 'send' ? 'to Send' : 'Needed'}</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl"
                  placeholder="e.g. 50"
                  required
                />
              </div>

              {activeTab === 'send' ? (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason for Redistribution</label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g. Excess stock, Near-expiry"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Urgency / Note</label>
                  <Input
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g. High demand, Out of stock"
                    required
                  />
                </div>
              )}
            </div>

            {selectedProduct && quantity && Number(quantity) > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                  <span>Recommended {activeTab === 'send' ? 'Destination' : 'Source'} Branches</span>
                  {recsLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </label>
                
                {!recsLoading && recommendations.length === 0 && (
                   <div className="text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 font-medium">
                     No recommendations available at this time.
                   </div>
                )}

                {!recsLoading && recommendations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                    {recommendations.map(rec => (
                      <div 
                        key={rec.branch_id}
                        onClick={() => setSelectedBranch(rec.branch_id)}
                        className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          selectedBranch === rec.branch_id 
                            ? activeTab === 'send' ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className={`font-bold text-sm ${selectedBranch === rec.branch_id ? 'text-slate-900' : 'text-slate-800'}`}>
                            {rec.branch_name}
                          </div>
                          <div className={`text-xs mt-0.5 ${selectedBranch === rec.branch_id ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                            Current Stock: {rec.available_stock} units
                          </div>
                          {rec.near_expiry && activeTab === 'request' && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full tracking-wider">
                              Near Expiry Stock
                            </span>
                          )}
                        </div>
                        {selectedBranch === rec.branch_id && (
                          <CheckCircle2 className={`w-5 h-5 ${activeTab === 'send' ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSending || recsLoading || !selectedBranch || !selectedProduct} 
                className={`rounded-xl h-11 px-8 text-white font-bold shadow-sm flex items-center gap-2 ${activeTab === 'send' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50`}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit {activeTab === 'send' ? 'Redistribution' : 'Request'}</>}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Active Requests */}
      <div className="pt-4 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          Action Required <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{pendingInbound.length}</span>
        </h2>
        
        <div className="space-y-4">
          {pendingInbound.length === 0 ? (
             <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <p className="text-slate-500 text-sm font-medium">No pending inbound requests.</p>
             </div>
          ) : pendingInbound.map(t => (
            <div key={t.id} className="p-5 rounded-2xl shadow-sm border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Pending Action
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-0.5">{t.product}</h3>
                  <p className="font-mono text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 w-fit rounded-md mb-3">{t.batch}</p>
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-white px-3 py-2 border border-slate-100 rounded-xl w-fit">
                    <span>{t.from}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span>{t.to}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end justify-between">
                  <div className="font-bold text-slate-900 text-xl border-b-2 border-indigo-200 pb-1 mb-4 sm:mb-0">
                    {t.formattedQty}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button 
                      disabled={actionLoading === t.id}
                      onClick={() => handleUpdateStatus(t.id, 'Rejected')}
                      className="flex-1 sm:flex-none bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 h-10 px-4 rounded-xl text-sm font-bold shadow-sm"
                    >
                      Reject
                    </Button>
                    <Button 
                      disabled={actionLoading === t.id}
                      onClick={() => handleUpdateStatus(t.id, 'In-transit')}
                      className="flex-1 sm:flex-none bg-emerald-600 border border-emerald-500 hover:bg-emerald-700 text-white h-10 px-6 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center min-w-[100px]"
                    >
                      {actionLoading === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-slate-800 mb-4">History</h2>
        
        <div className="space-y-4">
          {allOtherTransfers.length > 0 ? allOtherTransfers.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col md:flex-row justify-between gap-4 transition-all hover:shadow-[0_4px_15px_rgb(0,0,0,0.04)]">
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.product}</h3>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)} <span className="uppercase tracking-wider">{item.status}</span>
                  </div>
                </div>

                <p className="font-mono text-xs text-slate-400 mb-4 font-semibold">{item.batch}</p>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 w-fit mb-3">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span>{item.from}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <span>{item.to}</span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0 min-w-[120px]">
                <div className="font-extrabold text-slate-800 text-xl">
                  {item.formattedQty}
                </div>
                <div className="mt-2 text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                  {item.direction}
                </div>
                {item.direction === 'Inbound' && item.status === 'In-transit' && (
                  <Button 
                    disabled={actionLoading === item.id}
                    onClick={() => handleUpdateStatus(item.id, 'Completed')}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 rounded-lg text-xs font-bold shadow-sm"
                  >
                    {actionLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Received'}
                  </Button>
                )}
              </div>

            </div>
          )) : (
             <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
               <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-300 mb-3" />
               <p className="text-slate-500 font-medium">No past redistributions found.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
