'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Store, CheckCircle, PackageSearch, AlertCircle, ShoppingBag } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInDays } from 'date-fns';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const lookupBatch = async (batchNumber: string) => {
  if (!batchNumber) return null;
  const res = await fetch(`http://localhost:9000/api/batches/lookup?batchNumber=${batchNumber}`);
  if (!res.ok) throw new Error('Failed to lookup batch');
  return res.json();
};

const submitFeedback = async (data: any) => {
  const res = await fetch('http://localhost:9000/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
};

// --- Form Validation Schemas ---
const step1Schema = z.object({
  branchId: z.string().min(1, 'Please select a branch'),
});

const step2Schema = z.object({
  batchNumber: z.string().min(3, 'Batch number is too short').max(50, 'Batch number is too long'),
});

const step3Schema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  categories: z.array(z.string()).optional(),
  feedbackText: z.string().min(10, 'Feedback must be at least 10 characters').max(500, 'Maximum 500 characters').optional().or(z.literal('')),
  recommend: z.boolean().optional(),
  buyAgain: z.enum(['Yes', 'No', 'Maybe']).optional(),
});

type FormData = {
  branchId: string;
  batchNumber: string;
  rating: number;
  categories: string[];
  feedbackText: string;
  recommend: boolean;
  buyAgain: 'Yes' | 'No' | 'Maybe';
};

const CATEGORIES = ['Product Quality', 'Freshness', 'Packaging', 'Price', 'Customer Service', 'Delivery'];

export default function CustomerFeedbackPage() {
  const [step, setStep] = useState(1);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified Form Context
  const { register, handleSubmit, watch, formState: { errors }, control, setValue, trigger } = useForm<FormData>({
    defaultValues: {
      batchNumber: '',
      rating: 0,
      categories: [],
      feedbackText: '',
    }
  });

  const batchNumber = watch('batchNumber');
  const rating = watch('rating');

  // Queries
  const { data: batchData, isLoading: isLoadingBatch, isFetching: isFetchingBatch } = useQuery({
    queryKey: ['batch', batchNumber],
    queryFn: () => lookupBatch(batchNumber),
    enabled: batchNumber.length >= 3,
  });

  const handleNextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger('batchNumber');
      if (isValid && (!batchData || !batchData.exists)) {
        // Prevent next step if batch is naturally invalid
        return;
      }
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handePreviousStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: FormData) => {
    // Validate Step 2
    const isStepValid = await trigger(['rating', 'feedbackText']);
    if (!isStepValid) return;

    try {
      setIsSubmitting(true);
      await submitFeedback({
        branchId: batchData?.batch?.branchId || '',
        batchNumber: data.batchNumber,
        productId: batchData?.batch?.productId,
        rating: data.rating,
        categories: data.categories,
        feedbackText: data.feedbackText,
        recommend: data.recommend,
        buyAgain: data.buyAgain
      });
      setSubmitSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string, daysLeft: number) => {
    if (status === 'fresh') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Fresh ({daysLeft} days left)</span>;
    } else if (status === 'near_expiry') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Near Expiry ({daysLeft} days left)</span>;
    } else {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Expired</span>;
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-12 px-6 shadow-xl border-0 rounded-2xl">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
          <p className="text-slate-500 mb-8">Your feedback helps us maintain the highest quality of dairy products.</p>
          <Button onClick={() => window.location.reload()} className="w-full rounded-xl" size="lg">
            Submit Another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="w-full max-w-xl text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Feedback</h1>
        <p className="text-slate-500">Share your experience with our dairy products</p>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === i ? 'bg-indigo-600 text-white' : step > i ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > i ? <CheckCircle className="w-4 h-4" /> : i}
              </div>
              {i < 2 && (
                <div className={`w-12 h-1 transition-colors ${step > i ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="w-full max-w-xl shadow-xl border-0 rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Batch Number */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Product Identification</h2>
                  <p className="text-sm text-slate-500">Find the batch number on your product packaging</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Batch Number *</label>
                    <div className="relative mt-1">
                      <Input
                        {...register('batchNumber')}
                        placeholder="e.g., MLK-2026-010"
                        className={`h-14 text-lg font-mono uppercase rounded-xl ${errors.batchNumber ? 'border-red-500' : ''}`}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          register('batchNumber').onChange(e);
                        }}
                      />
                      {isFetchingBatch && (
                        <div className="absolute right-4 top-4">
                           <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    {errors.batchNumber && <p className="text-red-500 text-sm mt-1">{errors.batchNumber.message}</p>}
                  </div>

                  {/* Real-time Badge Results */}
                  {batchNumber.length >= 3 && !isFetchingBatch && batchData && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                      {batchData.exists && batchData.batch ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                           <div className="flex justify-between items-start">
                             <div>
                               <div className="flex items-center space-x-2">
                                 <ShoppingBag className="w-5 h-5 text-slate-400" />
                                 <h3 className="font-semibold text-slate-800 text-lg">{batchData.batch.productName}</h3>
                               </div>
                               <p className="text-sm text-slate-500 mt-1">Found in {batchData.batch.branchName}</p>
                             </div>
                             {renderStatusBadge(batchData.batch.status, batchData.batch.daysLeft)}
                           </div>
                           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                             <div>
                               <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expiry Date</p>
                               <p className="text-sm font-medium text-slate-700 mt-1">{format(new Date(batchData.batch.expiryDate), 'MMM dd, yyyy')}</p>
                             </div>
                             <div>
                               <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Category</p>
                               <p className="text-sm font-medium text-slate-700 mt-1">{batchData.batch.productCategory || 'N/A'}</p>
                             </div>
                           </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 text-red-800">
                          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Batch not found</p>
                            <p className="text-sm opacity-90 mt-1">We couldn't find this batch number. Please check the number and try again.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={handleNextStep} 
                    disabled={!batchData?.exists} 
                    className="w-full rounded-xl h-12 text-lg"
                  >
                    Continue to Feedback
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Feedback Form */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Your Experience</h2>
                  <p className="text-sm text-slate-500">Tell us what you thought about {batchData?.batch?.productName}</p>
                </div>

                <form className="space-y-6">
                  {/* Rating */}
                  <div className="space-y-3 text-center">
                    <label className="text-sm font-medium text-slate-700">Overall Rating *</label>
                    <div className="flex justify-center space-x-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setValue('rating', star, { shouldValidate: true })}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`w-10 h-10 transition-colors ${
                                star <= (hoverRating || rating) 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-200 fill-slate-100'
                              }`} 
                            />
                          </button>
                       ))}
                    </div>
                    {errors.rating && <p className="text-red-500 text-sm mt-1">Please select a rating</p>}
                    <div className="h-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">What did you like / dislike?</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => {
                        const currentCats = watch('categories') || [];
                        const isSelected = currentCats.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              const nextCats = isSelected 
                                ? currentCats.filter(c => c !== cat)
                                : [...currentCats, cat];
                              setValue('categories', nextCats);
                            }}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                              isSelected 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Area */}
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-700 flex justify-between">
                       <span>Your Feedback</span>
                       <span className={`text-xs ${(!watch('feedbackText') || watch('feedbackText').length < 10) ? 'text-amber-500' : 'text-slate-400'}`}>
                         {(watch('feedbackText')?.length || 0)}/500
                       </span>
                     </label>
                     <textarea
                       {...register('feedbackText')}
                       placeholder="Please share your detailed experience with this product..."
                       className={`w-full min-h-[120px] p-4 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none ${errors.feedbackText ? 'border-red-500' : 'border-slate-200'}`}
                     />
                     {errors.feedbackText && <p className="text-red-500 text-sm mt-1">{errors.feedbackText.message}</p>}
                  </div>

                  <div className="flex space-x-3 pt-6 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={handePreviousStep} className="w-1/3 rounded-xl h-12">Back</Button>
                    <Button 
                      type="button"
                      onClick={handleSubmit(onSubmit)} 
                      disabled={isSubmitting || rating === 0} 
                      className="w-2/3 rounded-xl h-12 text-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>Submitting...</span>
                        </div>
                      ) : (
                        'Submit Feedback'
                      )}
                    </Button>
                  </div>
                </form>

              </motion.div>
            )}

          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
