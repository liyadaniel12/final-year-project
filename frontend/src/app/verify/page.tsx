'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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

  const handleVerify = () => {
    if (!batchNumber.trim()) return;

    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      // Mock Data Logic based on input
      const inputUpperCase = batchNumber.toUpperCase();
      let status: FreshnessStatus = 'fresh';
      
      if (inputUpperCase.includes('WARN') || inputUpperCase.includes('NEAR')) {
        status = 'near_expiry';
      } else if (inputUpperCase.includes('EXP') || inputUpperCase.includes('OLD')) {
        status = 'expired';
      }

      setResult({
        productName: 'Premium Full Cream Milk (1L)',
        productionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 5 days ago
        expiryDate: new Date(Date.now() + (status === 'expired' ? -1 : 5) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status
      });
      setIsVerifying(false);
      
      // Reset feedback on new search
      setFeedbackSubmitted(false);
      setRating(0);
      setCustomerName('');
      setFeedbackText('');
    }, 1000);
  };

  const handleSubmitFeedback = () => {
    if (!customerName.trim() || (rating === 0 && !feedbackText.trim())) return;
    
    setIsSubmittingFeedback(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmittingFeedback(false);
      setFeedbackSubmitted(true);
    }, 800);
  };

  const getStatusConfig = (status: FreshnessStatus) => {
    switch(status) {
      case 'fresh':
        return {
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          message: 'This product is safe to use',
          icon: '✅',
          label: 'Fresh'
        };
      case 'near_expiry':
        return {
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          message: 'Use soon',
          icon: '⚠️',
          label: 'Near Expiry'
        };
      case 'expired':
        return {
          badgeClass: 'bg-red-100 text-red-800 border-red-200',
          message: 'Do not consume',
          icon: '🛑',
          label: 'Expired'
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
                    Try entering "WARN" or "EXP" to test other states.
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
                      <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${config.badgeClass}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{config.icon}</span>
                          <span className="font-bold tracking-wide uppercase">{config.label}</span>
                        </div>
                        <p className="font-medium opacity-90">{config.message}</p>
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
                    <p className="font-medium text-green-800">Thank you for your feedback!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Your Name</label>
                      <Input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-12 text-base rounded-xl"
                      />
                    </div>

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

                    <Button 
                      onClick={handleSubmitFeedback} 
                      disabled={isSubmittingFeedback || !customerName.trim() || (rating === 0 && !feedbackText.trim())}
                      className="w-full text-sm rounded-xl"
                      variant="secondary"
                    >
                      {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
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
