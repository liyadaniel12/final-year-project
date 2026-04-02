'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Star } from 'lucide-react';

type FreshnessStatus = 'fresh' | 'near_expiry' | 'expired' | null;

interface VerificationResult {
  productName: string;
  productionDate: string;
  expiryDate: string;
  status: FreshnessStatus;
}

export default function VerifyProductPage() {
  const [batchNumber, setBatchNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  // Feedback state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Critical feedback state
  const [branchId, setBranchId] = useState('');
  const [customBranch, setCustomBranch] = useState('');
  const [isConfirmedExpired, setIsConfirmedExpired] = useState(false);

  const isExpired = result?.status === 'expired';

  useEffect(() => {
    if (isExpired) {
      const finalBranch = branchId === 'Other' ? customBranch : branchId;
      setFeedbackText(`URGENT: I purchased an expired product (Batch: ${batchNumber}) from ${finalBranch || '[branch selection]'}`);
    }
  }, [branchId, customBranch, batchNumber, isExpired]);

  const handleVerify = () => {
    if (!batchNumber.trim()) return;

    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      const inputUpperCase = batchNumber.toUpperCase();
      let status: FreshnessStatus = 'fresh';
      
      if (inputUpperCase.includes('WARN') || inputUpperCase.includes('NEAR')) {
        status = 'near_expiry';
      } else if (inputUpperCase.includes('EXP') || inputUpperCase.includes('OLD')) {
        status = 'expired';
      }

      setResult({
        productName: 'Premium Full Cream Milk (1L)',
        productionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        expiryDate: new Date(Date.now() + (status === 'expired' ? -1 : 5) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status
      });
      setIsVerifying(false);
      
      // Reset feedback on new search
      setFeedbackSubmitted(false);
      setRating(0);
      setCustomerName('');
      setFeedbackText('');
      setBranchId('');
      setCustomBranch('');
      setIsConfirmedExpired(false);
    }, 1000);
  };

  const handleSubmitFeedback = async () => {
    if (!customerName.trim() || !branchId) return;
    if (branchId === 'Other' && !customBranch.trim()) return;

    if (isExpired) {
      if (!isConfirmedExpired) return;
    } else {
      if (rating === 0 && !feedbackText.trim()) return;
    }
    
    setIsSubmittingFeedback(true);
    const finalBranch = branchId === 'Other' ? customBranch : branchId;
    
    try {
      const res = await fetch('http://localhost:9000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: finalBranch,
          batchNumber,
          rating: isExpired ? 1 : rating,
          feedbackText,
          isCritical: isExpired
        })
      });

      if (res.ok) {
        setFeedbackSubmitted(true);
      } else {
        // Fallback or error styling could go here
        setFeedbackSubmitted(true); 
      }
    } catch (err) {
      console.error(err);
      // Let user proceed for UX on network errors in this demo
      setFeedbackSubmitted(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusConfig = (status: FreshnessStatus) => {
    switch(status) {
      case 'fresh':
        return {
          containerClass: 'bg-green-100 text-green-800 border-green-200 border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2',
          message: 'This product is safe to use',
          icon: '✅',
          label: 'Fresh'
        };
      case 'near_expiry':
        return {
          containerClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2',
          message: 'Use soon',
          icon: '⚠️',
          label: 'Near Expiry'
        };
      case 'expired':
        return {
          containerClass: 'bg-[#ffebee] text-[#d32f2f] border-[#d32f2f] border-[2px] p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3 animate-[pulse_2s_ease-in-out_infinite]',
          message: 'CRITICAL: DO NOT CONSUME!',
          icon: '⚠️',
          label: 'Expired Product'
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white text-center py-6">
            <h1 className="text-xl font-semibold">Dairy Chain System</h1>
            <p className="text-slate-300 text-sm mt-1">Product Quality Verification</p>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            
            {/* Section 1: Batch Verification */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-slate-800">Verify Product Freshness</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="batch-input" className="text-sm font-medium text-slate-700">Enter Batch Number</label>
                  <Input
                    id="batch-input"
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. BATCH12345"
                    className="h-12 text-lg rounded-xl"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Try entering &quot;WARN&quot; or &quot;EXP&quot; to test other states.
                  </p>
                </div>
                <Button 
                  onClick={handleVerify} 
                  disabled={isVerifying || !batchNumber.trim()}
                  className="w-full h-12 text-base rounded-xl font-medium shadow-sm transition-all"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Product'}
                </Button>
              </div>
            </div>

            {/* Section 2: Result visibility conditioned on search */}
            {result && (
              <div className="border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Verification Result</h3>
                
                <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-900">{result.productName}</h4>
                      <div className="text-sm text-slate-500 mt-1 space-y-1">
                        <p>Production: <span className="font-medium text-slate-700">{result.productionDate}</span></p>
                        <p>Expiry: <span className="font-medium text-slate-700">{result.expiryDate}</span></p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const config = getStatusConfig(result.status);
                    if (!config) return null;
                    
                    return (
                      <div className={config.containerClass}>
                        <div className="flex items-center space-x-2">
                          <span className={result.status === 'expired' ? "text-3xl" : "text-xl"}>{config.icon}</span>
                          <span className={`${result.status === 'expired' ? "text-xl font-extrabold" : "font-bold"} tracking-wide uppercase`}>{config.label}</span>
                        </div>
                        <p className={`${result.status === 'expired' ? "text-lg font-bold" : "font-medium"} opacity-90`}>{config.message}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Section 3: Feedback visibility conditioned on result */}
            {result && (
              <div className="border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Customer Feedback</h3>
                
                {feedbackSubmitted ? (
                  <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      ✓
                    </div>
                    {isExpired ? (
                       <p className="font-medium text-green-800">Critical alert sent to management. Thank you for reporting.</p>
                    ) : (
                       <p className="font-medium text-green-800">Thank you for your feedback!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Your Name <span className="text-red-500">*</span></label>
                      <Input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-12 text-base rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-sm font-medium ${isExpired ? 'text-[#d32f2f]' : 'text-slate-700'}`}>
                        Which branch did you purchase from? <span className="text-red-500">*</span>
                      </label>
                      <select 
                        required 
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className={`flex h-12 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${isExpired ? 'border-slate-200 focus:ring-orange-500' : 'border-slate-200 focus:ring-slate-900 focus:border-transparent'}`}
                      >
                        <option value="">-- Select Branch --</option>
                        <option value="Main Branch">Main Branch (Bahir Dar Center)</option>
                        <option value="North Branch">North Branch (Kebele 13)</option>
                        <option value="South Branch">South Branch (Kebele 11)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {branchId === 'Other' && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                        <label className={`text-sm font-medium ${isExpired ? 'text-[#d32f2f]' : 'text-slate-700'}`}>Please specify branch <span className="text-red-500">*</span></label>
                        <Input
                          type="text"
                          value={customBranch}
                          onChange={(e) => setCustomBranch(e.target.value)}
                          placeholder="Enter branch name/location"
                          className="h-12 text-base rounded-xl"
                        />
                      </div>
                    )}

                    {isExpired ? (
                      <div className="space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-[#d32f2f]">Batch Number</label>
                          <Input
                            type="text"
                            value={batchNumber}
                            readOnly
                            disabled
                            className="bg-slate-100 text-slate-600 font-medium"
                          />
                        </div>
                        
                        <div className="bg-[#ffebee] p-3 rounded-lg border border-[#d32f2f]/30">
                          <p className="font-bold text-[#d32f2f] text-sm">
                            {feedbackText}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3 pt-2">
                          <input 
                            type="checkbox" 
                            id="confirmExpired" 
                            checked={isConfirmedExpired}
                            onChange={(e) => setIsConfirmedExpired(e.target.checked)}
                            className="w-5 h-5 text-[#d32f2f] border-slate-300 rounded focus:ring-[#d32f2f]/50 cursor-pointer"
                          />
                          <label htmlFor="confirmExpired" className="text-sm font-bold text-[#d32f2f] cursor-pointer" style={{userSelect: "none"}}>
                            I confirm this product was expired when purchased
                          </label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className={`p-1 transition-colors ${
                                star <= (hoverRating || rating) 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-slate-200'
                              }`}
                            >
                              <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Write your feedback..."
                          className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm resize-none text-slate-800"
                        />
                      </>
                    )}

                    <Button 
                      onClick={handleSubmitFeedback} 
                      disabled={isSubmittingFeedback || !customerName.trim() || !branchId || (branchId === 'Other' && !customBranch.trim()) || (isExpired ? !isConfirmedExpired : (rating === 0 && !feedbackText.trim()))}
                      className={isExpired ? "w-full text-base rounded-xl h-12 bg-[#d32f2f] hover:bg-[#b71c1c] text-white shadow-sm transition-all" : "w-full text-sm rounded-xl"}
                      variant={isExpired ? undefined : "secondary"}
                    >
                      {isSubmittingFeedback ? 'Submitting...' : (isExpired ? 'Submit Critical Alert' : 'Submit Feedback')}
                    </Button>
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
