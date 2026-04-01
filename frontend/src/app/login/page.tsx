'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, BarChart, Store, User, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoClick = (demoEmail: string, demoPass: string = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // In a real system, username might be used, but since Supabase is configured 
      // for email, we treat the 'username' field as email.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      // AuthProvider or middleware will redirect on success
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-teal-100 selection:text-teal-900 relative">
      <Link href="/" className="absolute top-6 left-4 sm:left-6 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-100 z-10">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[500px]"
      >
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden">
          
          <div className="p-8 pb-6 sm:p-10 sm:pb-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome back</h1>
              <p className="text-slate-500 font-medium">Sign in to access your dashboard</p>
            </div>

            {/* Quick Demo Access */}
            <div className="mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Quick Demo Access</p>
              <div className="flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => handleDemoClick('admin@dairy.com')}
                  className="flex items-center text-left gap-4 p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-white hover:shadow-md hover:scale-[1.02] hover:border-blue-200 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">System Admin</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Full system control & user management</p>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleDemoClick('main@dairy.com')}
                  className="flex items-center text-left gap-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-white hover:shadow-md hover:scale-[1.02] hover:border-emerald-200 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                    <BarChart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Main Manager</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Analytics, expiry reports & redistribution</p>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleDemoClick('branch@dairy.com')}
                  className="flex items-center text-left gap-4 p-3 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-white hover:shadow-md hover:scale-[1.02] hover:border-amber-200 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <div className="bg-amber-100 text-amber-600 p-2.5 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Branch Manager</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Daily stock, sales & expiry operations</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center mb-8">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">or enter credentials</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 text-rose-600 p-3.5 rounded-xl text-sm font-medium border border-rose-100 flex items-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Enter username"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mt-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500/20" />
                  <span className="text-slate-600 font-medium">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center text-xs font-medium text-slate-400 mt-8">
          Expiry-Aware Dairy Distribution System &copy; 2026
        </p>
      </motion.div>
    </div>
  );
}
