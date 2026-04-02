'use client';

import React, { useState, useEffect } from 'react';
import { Truck, ArrowRight, CheckCircle2, AlertCircle, XCircle, Loader2, ArrowRightLeft, Store, User as UserIcon, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

export default function BranchTransferPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('Your Branch');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
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

      // If user has branch_id, fetch branch name
      if (user?.branch_id) {
        const { data: branchData } = await supabase.from('branches').select('name').eq('id', user.branch_id).single();
        if (branchData) setBranchName(branchData.name);
      } else {
        // Fallback: Infer from first transfer if possible
        const sampleTransfer = jsonData.transfers?.[0];
        if (sampleTransfer) {
          setBranchName(sampleTransfer.direction === 'Inbound' ? sampleTransfer.to : sampleTransfer.from);
        }
      }
    } catch (err: any) {
      console.error("Transfers error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
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
      if (!response.ok) throw new Error('Update failed');
      await fetchTransfers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      fetchRecommendations(selectedProduct);
    } else {
      setRecommendations([]);
      setSelectedBranch('');
    }
  }, [selectedProduct]);

  const fetchRecommendations = async (productId: string) => {
    setRecsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`http://localhost:9000/api/branch-manager/transfer-options?product_id=${productId}`, {
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

  const handleOpenModal = async () => {
    setSelectedProduct('');
    setQuantity('');
    setRecommendations([]);
    setSelectedBranch('');
    setIsModalOpen(true);
    
    // Fetch products
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

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!selectedBranch) {
      toast.error('Please select a recommended branch to request from.');
      return;
    }

    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const payload = {
        from_branch_id: user?.branch_id || undefined, // We are sending
        to_branch_id: selectedBranch, // They are receiving
        product_id: selectedProduct,
        quantity: Number(quantity)
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
      
      toast.success('Transfer request sent successfully');
      setIsModalOpen(false);
      await fetchTransfers();
    } catch(e) {
      console.error(e);
      toast.error('Failed to send request');
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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Redistribution</h1>
        <p className="text-slate-500 font-medium pb-2 border-b border-slate-200">Send, accept, or reject transfer requests</p>
      </div>

      {/* Active Requests Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          Active Requests <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{pendingInbound.length}</span>
        </h2>
        <Button onClick={handleOpenModal} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm font-bold h-10 px-4 text-sm gap-2">
          <Send className="w-4 h-4 shrink-0" /> Send Request
        </Button>
      </div>

      {/* Pending Requests List */}
      <div className="space-y-4">
        {pendingInbound.length === 0 ? (
           <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-slate-500 text-sm font-medium">No active inbound requests at the moment.</p>
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

      <div className="pt-6 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Transfer History</h2>
        
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
               <p className="text-slate-500 font-medium">No past transfers found.</p>
             </div>
          )}
        </div>
      </div>

      {/* Send Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Stock Transfer">
        <form onSubmit={handleSendRequest} className="space-y-5">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              <option value="">-- Choose a product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="space-y-1">
              <Input
                label="Quantity Needed"
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
          )}

          {selectedProduct && quantity && Number(quantity) > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>System Recommendations</span>
                {recsLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </label>
              
              {!recsLoading && recommendations.length === 0 && (
                 <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                   No other branches currently have stock for this product.
                 </div>
              )}

              {!recsLoading && recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-2">Select a branch to send stock to. Sorted from lowest stock to highest stock (branches that need it most).</p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                    {recommendations.map(rec => (
                      <div 
                        key={rec.branch_id}
                        onClick={() => setSelectedBranch(rec.branch_id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          selectedBranch === rec.branch_id 
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className={`font-bold text-sm ${selectedBranch === rec.branch_id ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {rec.branch_name}
                          </div>
                          <div className={`text-xs ${selectedBranch === rec.branch_id ? 'text-indigo-600' : 'text-slate-500'}`}>
                            Available: {rec.available_stock} units
                          </div>
                        </div>
                        {selectedBranch === rec.branch_id && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-10 px-4">Cancel</Button>
            <Button 
              type="submit" 
              disabled={isSending || recsLoading} 
              className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Request'}
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
