'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email validation regex
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email address is required.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://final-year-project-h5uk.onrender.com/api'}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'the email address does not exist');
        setIsSubmitting(false);
        return;
      }
      
      setStep('otp');
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://final-year-project-h5uk.onrender.com/api'}/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'you have entered incorrect code');
        setIsSubmitting(false);
        return;
      }
      
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}&code=${encodeURIComponent(otp.trim())}`);
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
            <Droplet className="w-8 h-8 text-indigo-500 fill-indigo-100" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
            Expiry-Aware Dairy
          </h2>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden relative">
          
          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.div 
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Forgot your password?</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Enter your registered email address to receive a verification code.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-6" noValidate>
                    {/* Error Animation */}
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                          className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-3"
                          role="alert"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200">
                          <Mail className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(null); }}
                          className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'} rounded-xl text-slate-900 text-sm focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium`}
                          placeholder="Enter your email address"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none transform"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Continue</span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div 
                  key="otp-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">code verification</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      we have send a password reset otp to your email( <span className="font-bold text-slate-700">{email}</span> )
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-6" noValidate>
                    {/* Error Animation */}
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                          className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-3"
                          role="alert"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <label htmlFor="otp" className="block text-sm font-bold text-slate-700">
                        Enter code
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200">
                          <KeyRound className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                        </div>
                        <input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value); setError(null); }}
                          className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'} rounded-xl text-slate-900 text-sm focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium tracking-widest`}
                          placeholder="000000"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none transform"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Submit</span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Footer Link */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-center">
            <Link 
              href="/login" 
              className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
          </div>
        </div>
        
        {/* Page Footer */}
        <p className="text-center text-xs font-semibold tracking-wide text-slate-400 mt-10 opacity-80">
          Expiry-Aware Dairy Distribution System &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
