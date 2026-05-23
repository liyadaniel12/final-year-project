'use client';

import React, { useState, useEffect } from 'react';
import { Star, Search, CheckCircle, AlertTriangle, XOctagon, ShieldX, Loader2, ShoppingBag, MapPin, Send } from 'lucide-react';

type FreshnessStatus = 'fresh' | 'near_expiry' | 'expired' | null;

interface BatchResult {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  productionDate: string;
  daysLeft: number;
  status: FreshnessStatus;
  branchId: string;
  branchName: string;
  isActive: boolean;
}

interface LookupResponse {
  exists: boolean;
  discontinued?: boolean;
  message?: string;
  batch?: BatchResult;
}

interface Branch {
  id: string;
  name: string;
}

const API_BASE = 'http://localhost:9000/api';

export default function VerifyProductPage() {
  const [batchNumber, setBatchNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResponse | null>(null);
  const [lookupError, setLookupError] = useState('');

  // Feedback state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Branch list from DB
  const [branches, setBranches] = useState<Branch[]>([]);

  // Fetch branches on mount
  useEffect(() => {
    fetch(`${API_BASE}/branches/public`)
      .then(res => res.json())
      .then(data => setBranches(data.branches || []))
      .catch(err => console.error('Failed to fetch branches:', err));
  }, []);

  const handleVerify = async () => {
    const trimmed = batchNumber.trim();
    if (!trimmed) return;

    setIsVerifying(true);
    setLookupResult(null);
    setLookupError('');
    setFeedbackSubmitted(false);
    setRating(0);
    setCustomerName('');
    setFeedbackText('');
    setSelectedBranchId('');
    setFeedbackError('');

    try {
      const res = await fetch(`${API_BASE}/batches/lookup?batchNumber=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }
      const data: LookupResponse = await res.json();
      setLookupResult(data);

      // Auto-select branch if batch has one
      if (data.batch?.branchId) {
        setSelectedBranchId(data.batch.branchId);
      }
    } catch (err) {
      console.error(err);
      setLookupError('Unable to reach the server. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const handleSubmitFeedback = async () => {
    if (!customerName.trim()) return;
    if (rating === 0) return;

    setIsSubmittingFeedback(true);
    setFeedbackError('');

    const batch = lookupResult?.batch;
    const isExpired = batch?.status === 'expired';

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId || batch?.branchId || null,
          batchNumber: batch?.batchNumber || batchNumber.trim(),
          productId: batch?.productId || null,
          customerName: customerName.trim(),
          rating,
          feedbackText: feedbackText.trim(),
          isCritical: isExpired || rating <= 2,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit feedback');
      }

      setFeedbackSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setFeedbackError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusConfig = (status: FreshnessStatus) => {
    switch (status) {
      case 'fresh':
        return {
          gradient: 'from-emerald-500 to-green-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: <CheckCircle className="w-6 h-6" />,
          label: 'Fresh',
          message: 'This product is safe to consume',
        };
      case 'near_expiry':
        return {
          gradient: 'from-amber-500 to-orange-500',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: <AlertTriangle className="w-6 h-6" />,
          label: 'Near Expiry',
          message: 'Use this product soon',
        };
      case 'expired':
        return {
          gradient: 'from-red-600 to-rose-700',
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-800',
          icon: <XOctagon className="w-6 h-6" />,
          label: 'Expired',
          message: 'DO NOT CONSUME — Return to seller',
        };
      default:
        return null;
    }
  };

  const batch = lookupResult?.batch;
  const statusConfig = batch ? getStatusConfig(batch.status) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col items-center justify-start pt-8 pb-16 px-4">

      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Product Verification</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Verify product freshness & share your feedback</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">

          {/* Search Section */}
          <div className="p-6 pb-5 border-b border-slate-100">
            <label htmlFor="batch-input" className="block text-sm font-semibold text-slate-700 mb-2">
              Batch Number
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  id="batch-input"
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. MLK-2026-001"
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-base font-mono uppercase tracking-wider placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
                />
                {isVerifying && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={handleVerify}
                disabled={isVerifying || !batchNumber.trim()}
                className="h-12 px-5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4" />
                Verify
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Find the batch number printed on your product packaging</p>
          </div>

          {/* Error State */}
          {lookupError && (
            <div className="p-6 border-b border-slate-100">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <XOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{lookupError}</p>
              </div>
            </div>
          )}

          {/* Not Found */}
          {lookupResult && !lookupResult.exists && (
            <div className="p-6 border-b border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Batch Not Found</p>
                <p className="text-sm text-slate-500 mt-1">We couldn't find this batch number in our system. Please check and try again.</p>
              </div>
            </div>
          )}

          {/* Discontinued Product */}
          {lookupResult?.discontinued && (
            <div className="p-6 border-b border-slate-100">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5 text-center">
                <ShieldX className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-bold text-gray-600 text-lg">Product Discontinued</p>
                <p className="text-sm text-gray-500 mt-1">{lookupResult.batch?.productName || 'This product'} is no longer available in our system.</p>
                <p className="text-xs text-gray-400 mt-3">If you purchased this product recently, please contact customer support.</p>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {batch && !lookupResult?.discontinued && statusConfig && (
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Verification Result</h3>

              {/* Product Info */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{batch.productName}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{batch.branchName}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-white text-slate-500 px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                    {batch.batchNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">
                      {new Date(batch.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Remaining</p>
                    <p className={`text-sm font-bold mt-0.5 ${batch.daysLeft < 0 ? 'text-red-600' : batch.daysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {batch.daysLeft < 0 ? `Expired ${Math.abs(batch.daysLeft)} days ago` : `${batch.daysLeft} days`}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-xl p-4 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${statusConfig.gradient} text-white flex items-center justify-center shadow-sm`}>
                    {statusConfig.icon}
                  </div>
                  <div>
                    <p className={`font-bold ${statusConfig.text}`}>{statusConfig.label}</p>
                    <p className={`text-sm ${statusConfig.text} opacity-80`}>{statusConfig.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {batch && !lookupResult?.discontinued && (
            <div className="p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Share Your Feedback</h3>

              {feedbackSubmitted ? (
                <div className="bg-emerald-50 rounded-xl p-6 text-center border border-emerald-100">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-emerald-800 text-lg">Thank You!</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {batch.status === 'expired'
                      ? 'Your critical report has been sent to management.'
                      : 'Your feedback helps us maintain quality products.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
                    />
                  </div>

                  {/* Branch Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Purchase Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Star Rating */}
                  <div className="text-center">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-9 h-9 transition-colors ${
                              star <= (hoverRating || rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="h-5 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Your Feedback
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us about your experience with this product..."
                      className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
                    />
                  </div>

                  {/* Critical Warning for Expired */}
                  {batch.status === 'expired' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                      <XOctagon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-700 font-medium">
                        This product is expired. Your feedback will be flagged as a <strong>critical alert</strong> and escalated to management immediately.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {feedbackError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                      {feedbackError}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback || !customerName.trim() || rating === 0}
                    className={`w-full h-12 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
                      batch.status === 'expired'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {batch.status === 'expired' ? 'Submit Critical Report' : 'Submit Feedback'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Dairy Chain System — Expiry-Aware Distribution
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
