import Link from 'next/link';
import { LogIn, Package, Timer, ArrowRightLeft } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* Navigation / Header Area */}
      <nav className="w-full p-4 sm:p-6 flex items-center justify-between mx-auto max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 text-white p-2 rounded-xl shadow-sm">
             <Package className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800 hidden sm:block">Dairy System</span>
        </div>
        <Link 
          href="/login" 
          className="text-sm font-semibold text-teal-700 bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100 transition-colors border border-teal-100"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-24 text-center max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
          Dairy Stock <span className="text-teal-600">Management</span> System
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          A system for managing dairy product stock, monitoring expiry, and handling branch redistribution efficiently.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_14px_0_rgba(13,148,136,0.39)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.23)] transition-all hover:-translate-y-0.5"
        >
          <LogIn className="w-5 h-5" />
          Sign In to System
        </Link>
        <p className="text-sm text-slate-400 mt-4 font-medium">
          Secure access for admins, managers & branch staff
        </p>
      </main>

      {/* Features Section */}
      <section className="w-full bg-white border-t border-slate-200 py-16 md:py-24 px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-slate-50 opacity-40 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
           
           <div className="text-center mb-12">
             <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Core System Features</h2>
             <p className="text-slate-500 max-w-2xl mx-auto font-medium">Everything needed to effectively manage a multi-branch dairy distribution network.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
             {/* Feature 1 */}
             <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
               <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl mb-6">
                 <Package className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Stock Management</h3>
               <p className="text-slate-500 font-medium">
                 Track and manage dairy product stock across branches
               </p>
             </div>

             {/* Feature 2 */}
             <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
               <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl mb-6">
                 <Timer className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Expiry Monitoring</h3>
               <p className="text-slate-500 font-medium">
                 Monitor product expiry and reduce waste
               </p>
             </div>

             {/* Feature 3 */}
             <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
               <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl mb-6">
                 <ArrowRightLeft className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Branch Redistribution</h3>
               <p className="text-slate-500 font-medium">
                 Transfer products between branches efficiently
               </p>
             </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-teal-800 text-teal-100 py-10 px-4 md:px-8 mt-auto border-t border-teal-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} Expiry-Aware Dairy Distribution System. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-sm font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">Stock Management</span>
            <span className="hover:text-white transition-colors cursor-pointer">Expiry Monitoring</span>
            <span className="hover:text-white transition-colors cursor-pointer">Redistribution</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
