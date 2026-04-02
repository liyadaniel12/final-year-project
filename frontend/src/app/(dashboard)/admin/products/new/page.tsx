'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Tag, Ruler, Info, Calendar, FileText, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  category: z.string().min(1, 'Please select a category'),
  unit: z.enum(['L', 'g', 'kg']),
  shelf_life_days: z.number().min(1, 'Minimum shelf life is 1 day').max(365, 'Maximum shelf life is 365 days'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

const PRESETS = [
  { label: '3 days (ultra-fresh)', value: 3 },
  { label: '7 days (fresh milk)', value: 7 },
  { label: '14 days (pasteurized)', value: 14 },
  { label: '21 days (yogurt)', value: 21 },
  { label: '30 days (long-life)', value: 30 },
  { label: '60 days (cheese)', value: 60 },
  { label: '90 days (butter)', value: 90 },
  { label: '180 days (hard cheese)', value: 180 },
];

export default function AddProductPage() {
  const router = useRouter();
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      unit: 'L',
      shelf_life_days: 14,
      description: '',
    }
  });

  const shelfLifeDays = watch('shelf_life_days') || 0;
  const description = watch('description') || '';
  
  const simulatedExpiry = addDays(new Date(), shelfLifeDays);

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('http://localhost:9000/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...data,
          price: 0, // Default price since admin form doesn't request it just yet
          stock: 0, // Default stock since branches stock it
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Product registered successfully!');
      router.push('/admin/products');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center text-sm text-slate-500 space-x-1 mb-2">
          <Link href="/admin" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/admin/products" className="hover:text-indigo-600 transition-colors">Products</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Add New</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Register New Product</h1>
            <p className="text-slate-500 mt-1">Add products to the system. Shelf life determines automatic expiry calculation.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/products')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form Form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Product Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* 1. Product Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Product Name <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    {...register('name')} 
                    placeholder="e.g., Fresh Milk, Greek Yogurt, Cheddar Cheese" 
                    className={`h-12 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 2. Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Category <span className="text-red-500">*</span>
                    </label>
                    <select 
                      {...register('category')}
                      className={`flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Category</option>
                      <option value="Milk">Milk</option>
                      <option value="Yogurt">Yogurt</option>
                      <option value="Cheese">Cheese</option>
                      <option value="Butter">Butter</option>
                      <option value="Cream">Cream</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                  </div>

                  {/* 3. Unit */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Unit of Measurement <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4 h-12 items-center">
                      {[
                        { val: 'L', label: 'Liters (L)' },
                        { val: 'g', label: 'Grams (g)' },
                        { val: 'kg', label: 'Kilograms (kg)' }
                      ].map((u) => (
                        <label key={u.val} className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="radio" 
                            value={u.val} 
                            {...register('unit')}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" 
                          />
                          <span className="text-sm text-slate-700">{u.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
                    <p className="text-xs text-slate-400">Used for quantity tracking across branches</p>
                  </div>
                </div>

                {/* 4. Shelf Life (days) - CRITICAL FIELD */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" /> Shelf Life (days) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                      ⚠️ Stock Expiry = Stock Date + Shelf Life
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <Input 
                      type="number"
                      {...register('shelf_life_days', { valueAsNumber: true })} 
                      className={`h-12 w-32 text-lg font-bold text-center ${errors.shelf_life_days ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <span className="text-slate-500 font-medium">Days</span>
                  </div>
                  {errors.shelf_life_days && <p className="text-red-500 text-xs">{errors.shelf_life_days.message}</p>}

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setValue('shelf_life_days', preset.value, { shouldValidate: true })}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                          shelfLifeDays === preset.value
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Visual Preview */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={shelfLifeDays}
                    className="mt-4 bg-slate-900 rounded-xl p-4 flex items-center justify-between text-white"
                  >
                    <div className="text-sm text-slate-300">
                      <p>If stocked today:</p>
                      <p className="font-semibold text-white mt-0.5">Stock Date: {format(new Date(), 'MMM dd, yyyy')}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-500" />
                    <div className="text-right text-sm text-emerald-400">
                      <p className="text-slate-300">Expires on:</p>
                      <p className="font-bold text-lg mt-0.5">{format(simulatedExpiry, 'MMM dd, yyyy')}</p>
                    </div>
                  </motion.div>
                </div>

                {/* 5. Description */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <span className={`text-xs ${description.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {description.length} / 500
                    </span>
                  </div>
                  <textarea 
                    {...register('description')}
                    placeholder="e.g., Pasteurized whole milk, 3.25% milkfat"
                    className="w-full min-h-[100px] p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="w-full h-14 text-lg rounded-xl shadow-lg"
                  >
                    {mutation.isPending ? 'Registering Product...' : 'Register Product'}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl bg-indigo-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                <Info className="w-5 h-5 text-indigo-600" /> Lifecycle Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-indigo-800/80">
              <p>
                The <strong>Shelf Life</strong> is the heartbeat of our Expiry-Aware system. 
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>When a branch logs stock, the system auto-calculates the exact expiry date.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Products with {"<"} 7 days remaining will trigger alerts for Branch Managers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Expired products are automatically flagged and hidden from public verification.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-amber-200 shadow-sm rounded-2xl bg-amber-50">
             <CardContent className="p-5 text-sm text-amber-800 space-y-2">
                 <p className="font-semibold flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" /> Recommendation
                 </p>
                 <p>
                   Always double check the shelf life for generic categories. Setting an artificially low shelf life may cause <strong>premature expiry warnings</strong> across all active branches holding this product.
                 </p>
             </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Temporary icon to avoid ts error if not imported above
function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
