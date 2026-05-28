'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const email = searchParams.get('email');

    if (!email) {
      setError('Invalid session. Please return to login.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://final-year-project-h5uk.onrender.com/api'}/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change password');
        setIsSubmitting(false);
        return;
      }
      
      setIsSuccess(true);
      
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
            <ShieldAlert className="w-8 h-8 text-amber-500 fill-amber-100" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
            Action Required
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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Change Password</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      You are required to change your default password before accessing your dashboard.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

                    {/* Current Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="current-password" className="block text-sm font-bold text-slate-700">
                        Current Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200">
                          <Lock className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                        </div>
                        <input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => { setCurrentPassword(e.target.value); setError(null); }}
                          className={`block w-full pl-12 pr-12 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'} rounded-xl text-slate-900 text-sm focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium`}
                          placeholder="Your current or default password"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="new-password" className="block text-sm font-bold text-slate-700">
                        New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200">
                          <Lock className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                        </div>
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(null); }}
                          className={`block w-full pl-12 pr-12 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'} rounded-xl text-slate-900 text-sm focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium`}
                          placeholder="Must be at least 6 characters"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-700">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200">
                          <Lock className={`h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                        </div>
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                          className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'} rounded-xl text-slate-900 text-sm focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium`}
                          placeholder="Confirm your new password"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Change Password</span>
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
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Password Updated</h2>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    Your password has been successfully changed. You can now securely log in to your dashboard.
                  </p>
                  
                  <div className="space-y-4">
                    <Link href="/login" className="w-full py-4 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 flex items-center justify-center transform">
                      Login Now
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
