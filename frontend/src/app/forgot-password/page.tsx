'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordForm {
  email: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Email validation regex
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Simulate API Call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fixed success simulation
      setIsSuccess(true);
      setResendCooldown(60); // 60 seconds cooldown for resend
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle auto-redirect countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      router.push('/login');
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, router]);

  // Handle resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setIsSuccess(false);
    setCountdown(5);
    // Auto submits again
    const event = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/40 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-orange-100 selection:text-orange-900">
      
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
              {!isSuccess ? (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Forgot your password?</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Enter your registered email address and we will send you a password reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Error Shake Animation */}
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                          className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-3"
                          role="alert"
                          aria-live="assertive"
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
                          <Mail className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-orange-500'}`} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          aria-label="Email Address"
                          aria-invalid={!!error}
                          className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500'} rounded-xl text-slate-900 text-sm focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium`}
                          placeholder="Enter your email address"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none transform"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-6"
                  role="alert"
                  aria-live="polite"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Check your email</h2>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    We've sent a password reset link to <br/><span className="text-slate-800 font-bold">{email}</span>
                  </p>
                  
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-400">
                      Redirecting to login in <span className="text-orange-500 font-bold">{countdown}s</span>...
                    </p>

                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="text-sm font-bold text-orange-500 hover:text-orange-600 disabled:text-slate-300 transition-colors"
                    >
                      {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Click to resend link'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Footer Link */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-center">
            <Link 
              href="/login" 
              className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors"
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
