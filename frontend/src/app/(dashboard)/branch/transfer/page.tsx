'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft, Send, Download, Loader2, CheckCircle2,
  XCircle, AlertCircle, Truck, ArrowRight, Store, Package
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

export default function BranchRedistributionPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'request'>('send');
  const [branchName, setBranchName] = useState('Your Branch');

  // Products & stock
  const [products, setProducts] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);

  // Transfer form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transfers
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch helpers ───────────────────────────────────────
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchBranchName = async () => {
    if (user?.branch_id) {
      const { data } = await supabase.from('branches').select('name').eq('id', user.branch_id).single();
      if (data) setBranchName(data.name);
    }
  };

  const fetchProductsAndStock = async () => {
    const session = await getSession();
    if (!session?.access_token) return;

    try {
      const [prodRes, stockRes] = await Promise.all([
        fetch('http://localhost:9000/api/products?active_only=true'),
        fetch('http://localhost:9000/api/branch-manager/stock', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ]);

      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
      if (stockRes.ok) {
        const d = await stockRes.json();
        setStock(d.stock || []);
      }
    } catch (err) {
      console.error('Error fetching products/stock:', err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const session = await getSession();
      if (!session?.access_token) return;

      const res = await fetch('http://localhost:9000/api/branch-manager/transfers', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setTransfers(d.transfers || []);
      }
    } catch (err) {
      console.error('Transfers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (productId: string) => {
    setRecsLoading(true);
    try {
      const session = await getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `http://localhost:9000/api/branch-manager/transfer-options?product_id=${productId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const d = await res.json();
        setRecommendations(d.recommendations || []);
        if (d.recommendations?.length > 0) setSelectedBranch(d.recommendations[0].branch_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecsLoading(false);
    }
  };

  // ─── Effects ─────────────────────────────────────────────
  useEffect(() => {
    fetchBranchName();
    fetchProductsAndStock();
    fetchTransfers();
  }, [user]);

  useEffect(() => {
    if (selectedProduct) {
      fetchRecommendations(selectedProduct);
    } else {
      setRecommendations([]);
      setSelectedBranch('');
    }
  }, [selectedProduct]);

  // ─── Actions ─────────────────────────────────────────────
  const handleSendRequest = async () => {
    if (!selectedProduct || !quantity || !selectedBranch) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }
    setIsSending(true);
    setMessage(null);
    try {
      const session = await getSession();
      if (!session?.access_token) return;

      // For "send" tab → we are sending FROM our branch TO selected branch
      // For "request" tab → we are requesting FROM selected branch TO our branch
      const payload = activeTab === 'send'
        ? { from_branch_id: user?.branch_id, to_branch_id: selectedBranch, product_id: selectedProduct, quantity: Number(quantity) }
        : { from_branch_id: selectedBranch, to_branch_id: user?.branch_id, product_id: selectedProduct, quantity: Number(quantity) };

      const res = await fetch('http://localhost:9000/api/branch-manager/transfers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit request');
      }

      setMessage({ type: 'success', text: activeTab === 'send' ? '✅ Stock sent successfully!' : '✅ Stock request sent!' });
      setSelectedProduct('');
      setQuantity('');
      setSelectedBranch('');
      setRecommendations([]);
      await fetchTransfers();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const session = await getSession();
      if (!session?.access_token) return;

      await fetch(`http://localhost:9000/api/branch-manager/transfers/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await fetchTransfers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Derived data ────────────────────────────────────────
  const incomingPending = transfers.filter(t => t.direction === 'Inbound' && t.status === 'Pending');
  const outgoing = transfers.filter(t => t.direction === 'Outbound');
  const incomingOther = transfers.filter(t => t.direction === 'Inbound' && t.status !== 'Pending');

  const getAvailableStock = (productId: string) => {
    return stock.filter(s => s.product_id === productId).reduce((sum, s) => sum + Number(s.qty), 0);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Accepted': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'In-transit': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'In-transit': return <Truck className="w-3.5 h-3.5" />;
      case 'Completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Rejected': return <XCircle className="w-3.5 h-3.5" />;
      default: return <ArrowRightLeft className="w-3.5 h-3.5" />;
    }
  };

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Redistribution</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Send or request stock between branches</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
            {user?.email?.charAt(0) || 'M'}
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">{branchName}</div>
            <div className="text-xs text-slate-500 font-medium">{user?.email || 'Branch Manager'}</div>
          </div>
        </div>
      </div>

      {/* ── Send / Request Toggle ───────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 inline-flex">
        <button
          onClick={() => { setActiveTab('send'); setSelectedProduct(''); setQuantity(''); setRecommendations([]); setSelectedBranch(''); setMessage(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'send'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" /> Send Stock
        </button>
        <button
          onClick={() => { setActiveTab('request'); setSelectedProduct(''); setQuantity(''); setRecommendations([]); setSelectedBranch(''); setMessage(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'request'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Download className="w-4 h-4" /> Request Stock
        </button>
      </div>

      {/* ── Form Card ───────────────────────────────────────── */}
      <Card className={`rounded-2xl shadow-sm border overflow-hidden bg-white ${
        activeTab === 'send' ? 'border-indigo-100' : 'border-emerald-100'
      }`}>
        {/* Color top bar */}
        <div className={`h-1.5 w-full ${activeTab === 'send' ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />

        <div className="p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-800">
            {activeTab === 'send' ? 'Send Stock to Another Branch' : 'Request Stock from Another Branch'}
          </h2>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-xl text-sm font-medium border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Product + Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Type</label>
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
              >
                <option value="">Select Product...</option>
                {products
                  .filter(p => activeTab === 'request' || getAvailableStock(p.id) > 0)
                  .map(p => {
                    const avail = getAvailableStock(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit}){activeTab === 'send' ? ` — ${avail} available` : ''}
                      </option>
                    );
                  })}
              </select>
              {activeTab === 'send' && products.length > 0 && products.filter(p => getAvailableStock(p.id) > 0).length === 0 && (
                <p className="text-xs text-rose-600 font-medium mt-1">⚠️ No products with available stock to send.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Quantity ({products.find(p => p.id === selectedProduct)?.unit || 'units'})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={activeTab === 'send' && selectedProduct ? getAvailableStock(selectedProduct) : undefined}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className={`w-full h-11 px-3 rounded-xl border text-sm bg-white outline-none focus:ring-2 text-slate-800 font-medium placeholder:text-slate-400 ${
                  activeTab === 'send' && quantity && selectedProduct && Number(quantity) > getAvailableStock(selectedProduct)
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-indigo-500/20'
                }`}
              />
              {activeTab === 'send' && quantity && selectedProduct && Number(quantity) > getAvailableStock(selectedProduct) && (
                <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  ⚠️ Insufficient stock — only {getAvailableStock(selectedProduct)} {products.find(p => p.id === selectedProduct)?.unit || 'units'} available
                </p>
              )}
            </div>
          </div>

          {/* Branch Recommendations */}
          {selectedProduct && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>{activeTab === 'send' ? 'Find Branches to Send To' : 'Request From Branch'}</span>
                {recsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
              </label>

              {!recsLoading && recommendations.length === 0 && (
                <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  No other branches found for this product.
                </div>
              )}

              {!recsLoading && recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    {activeTab === 'send'
                      ? 'Branches with lowest stock shown first (highest need):'
                      : 'Branches with highest stock shown first (most available):'}
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                    {recommendations.map(rec => (
                      <div
                        key={rec.branch_id}
                        onClick={() => setSelectedBranch(rec.branch_id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          selectedBranch === rec.branch_id
                            ? `${activeTab === 'send' ? 'border-indigo-500 bg-indigo-50/50' : 'border-emerald-500 bg-emerald-50/50'} shadow-sm`
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            selectedBranch === rec.branch_id
                              ? activeTab === 'send' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${selectedBranch === rec.branch_id ? 'text-slate-900' : 'text-slate-700'}`}>
                              {rec.branch_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              Current stock: {rec.available_stock} units
                            </div>
                          </div>
                        </div>
                        {selectedBranch === rec.branch_id && (
                          <CheckCircle2 className={`w-5 h-5 ${activeTab === 'send' ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-3">
            <button
              onClick={handleSendRequest}
              disabled={isSending || !selectedProduct || !quantity || !selectedBranch || (activeTab === 'send' && Number(quantity) > getAvailableStock(selectedProduct))}
              className={`w-full h-12 rounded-xl text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                activeTab === 'send'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : activeTab === 'send' ? (
                <><Send className="w-4 h-4" /> Send Stock</>
              ) : (
                <><Download className="w-4 h-4" /> Request Stock</>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* ── Incoming Requests ───────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          Incoming Requests
          {incomingPending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {incomingPending.length} pending
            </span>
          )}
        </h2>

        {incomingPending.length === 0 && incomingOther.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
            <Download className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">No incoming transfer requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending first */}
            {incomingPending.map(t => (
              <div key={t.id} className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending Action
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{t.product}</h3>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-white px-3 py-2 border border-slate-100 rounded-xl w-fit">
                      <span>{t.from}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span>{t.to}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end justify-between">
                    <div className="font-bold text-slate-900 text-xl">{t.formattedQty}</div>
                    <div className="flex gap-2 w-full sm:w-auto mt-3">
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
                        className="flex-1 sm:flex-none bg-emerald-600 border border-emerald-500 hover:bg-emerald-700 text-white h-10 px-6 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center"
                      >
                        {actionLoading === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Other incoming */}
            {incomingOther.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{t.product}</h3>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(t.status)}`}>
                      {getStatusIcon(t.status)} {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>{t.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.to}</span>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end justify-between">
                  <div className="font-bold text-slate-800">{t.formattedQty}</div>
                  {t.status === 'In-transit' && (
                    <Button
                      disabled={actionLoading === t.id}
                      onClick={() => handleUpdateStatus(t.id, 'Completed')}
                      className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-lg text-xs font-bold shadow-sm"
                    >
                      {actionLoading === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Received'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Outgoing Requests ───────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          Outgoing Requests
          {outgoing.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {outgoing.length}
            </span>
          )}
        </h2>

        {outgoing.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
            <Send className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">No outgoing transfer requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoing.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{t.product}</h3>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(t.status)}`}>
                      {getStatusIcon(t.status)} {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.to}</span>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end justify-center">
                  <div className="font-bold text-slate-800">{t.formattedQty}</div>
                  <div className="mt-1 text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                    Outbound
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
