'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart3, LayoutList, RefreshCcw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

const reportOptions = [
  { id: 'stock', title: 'Stock Report', description: 'Current stock levels per branch and product type', icon: <BarChart3 className="w-6 h-6" /> },
  { id: 'sales', title: 'Sales Report', description: 'Sales quantities across all branches (no currency)', icon: <LayoutList className="w-6 h-6" /> },
  { id: 'expiry', title: 'Expiry Report', description: 'Products by expiry status: Green / Yellow / Red', icon: <Calendar className="w-6 h-6" /> },
  { id: 'transfer', title: 'Redistribution Report', description: 'All transfer requests and their statuses', icon: <RefreshCcw className="w-6 h-6" /> }
];

export default function GenerateReportsPage() {
  const [dataPayloads, setDataPayloads] = useState<any>({ stock: [], sales: [], transfers: [] });
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [productFilter, setProductFilter] = useState('All Products');
  const [activeReport, setActiveReport] = useState('stock');
  
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const headers = { 'Authorization': `Bearer ${session.access_token}` };
        
        // Fetch all endpoints concurrently
        const [stockRes, salesRes, transfersRes, branchesRes] = await Promise.all([
          fetch('http://localhost:9000/api/manager/stock', { headers }),
          fetch('http://localhost:9000/api/manager/sales', { headers }),
          fetch('http://localhost:9000/api/manager/transfers', { headers }),
          fetch('http://localhost:9000/api/branches/public')
        ]);

        const [stockData, salesData, transfersData, branchesData] = await Promise.all([
           stockRes.ok ? stockRes.json() : { stock: [] },
           salesRes.ok ? salesRes.json() : { sales: [] },
           transfersRes.ok ? transfersRes.json() : { transfers: [] },
           branchesRes.ok ? branchesRes.json() : { branches: [] }
        ]);

        setDataPayloads({
           stock: stockData.stock || [],
           sales: salesData.sales || [],
           transfers: transfersData.transfers || []
        });
        setBranches(branchesData.branches || []);

      } catch (err) {
        console.error("Error fetching reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getFilteredData = (reportType: string) => {
    let filtered: any[] = [];
    switch(reportType) {
      case 'sales':
        filtered = dataPayloads.sales.filter((item: any) => branchFilter === 'All Branches' || item.branch === branchFilter);
        break;
      case 'expiry':
      case 'stock':
        filtered = dataPayloads.stock.filter((item: any) => branchFilter === 'All Branches' || item.branch === branchFilter);
        break;
      case 'transfer':
        filtered = dataPayloads.transfers.filter((item: any) => 
          item.status === 'Completed' && 
          (branchFilter === 'All Branches' || item.from === branchFilter || item.to === branchFilter)
        );
        break;
      default:
        filtered = [];
    }

    if (productFilter !== 'All Products') {
      filtered = filtered.filter((item: any) => item.product?.toLowerCase().includes(productFilter.toLowerCase()));
    }

    return filtered;
  };

  const handleDownloadExcel = () => {
    let dataToExport: any[] = [];
    let fileName = '';
    const filtered = getFilteredData(activeReport);

    if (filtered.length === 0) {
      alert("No data available to export based on current filters.");
      return;
    }

    const formatProduct = (p: string) => {
      if (!p) return p;
      const lower = p.toLowerCase();
      if (lower.includes('cheese') || lower.includes('yogurt')) {
        return `${p} (0.5 kg)`;
      }
      return p;
    };

    let totalQty = 0;

    switch(activeReport) {
      case 'sales': {
        dataToExport = filtered.map((item: any) => {
          totalQty += Number(item.sold || 0);
          return {
            'Date & Time': item.date,
            'Branch': item.branch,
            'Product': formatProduct(item.product),
            'Batch': item.batch,
            'Qty Sold': item.sold,
            'Recorded By': item.recordedBy
          };
        });
        dataToExport.push({ 'Date & Time': 'TOTAL', 'Branch': '', 'Product': '', 'Batch': '', 'Qty Sold': totalQty, 'Recorded By': '' });
        fileName = 'Sales_Report';
        break;
      }
      case 'expiry': {
        dataToExport = filtered.map((item: any) => {
          totalQty += Number(item.qty || 0);
          return {
            'Branch': item.branch,
            'Product': formatProduct(item.product),
            'Batch': item.batch,
            'Quantity': item.qty,
            'Expiry Date': new Date(item.expiry).toLocaleDateString(),
            'Status': item.status
          };
        });
        dataToExport.push({ 'Branch': 'TOTAL', 'Product': '', 'Batch': '', 'Quantity': totalQty, 'Expiry Date': '', 'Status': '' });
        fileName = 'Expiry_Report';
        break;
      }
      case 'transfer': {
        dataToExport = filtered.map((item: any) => {
          totalQty += Number(item.qty || 0);
          return {
            'From Branch': item.from,
            'To Branch': item.to,
            'Product': formatProduct(item.product),
            'Quantity': item.qty,
            'Status': item.status
          };
        });
        dataToExport.push({ 'From Branch': 'TOTAL', 'To Branch': '', 'Product': '', 'Quantity': totalQty, 'Status': '' });
        fileName = 'Transfer_Report';
        break;
      }
      case 'stock':
      default: {
        dataToExport = filtered.map((item: any) => {
          totalQty += Number(item.qty || 0);
          return {
            'Batch': item.batch,
            'Product': formatProduct(item.product),
            'Branch': item.branch,
            'Quantity': item.qty,
            'Expiry Date': new Date(item.expiry).toLocaleDateString(),
            'Status': item.status
          };
        });
        dataToExport.push({ 'Batch': 'TOTAL', 'Product': '', 'Branch': '', 'Quantity': totalQty, 'Expiry Date': '', 'Status': '' });
        fileName = 'Stock_Report';
        break;
      }
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, fileName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getBadgeClass = (status: string) => {
    if (status === 'Fresh' || status === 'Accepted' || status === 'Completed') return 'bg-emerald-100 text-emerald-800';
    if (status === 'Pending' || status === 'Near Expiry' || status === 'In-transit') return 'bg-amber-100 text-amber-800';
    if (status === 'Expired' || status === 'Rejected') return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-800';
  }

  const renderTableContent = () => {
    const filtered = getFilteredData(activeReport);
    
    switch(activeReport) {
      case 'sales': {
        return (
          <>
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-white border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Date & Time</th><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Batch</th><th className="px-5 py-3 text-emerald-600">Qty Sold</th><th className="px-5 py-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item: any) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{item.date}</td>
                  <td className="px-5 py-3 font-medium text-slate-600">{item.branch}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{item.product}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.batch}</td>
                  <td className="px-5 py-3 font-bold text-emerald-600">{item.sold}</td>
                  <td className="px-5 py-3 text-slate-600">{item.recordedBy}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-400">No data available</td></tr>}
            </tbody>
          </>
        )
      }
      case 'expiry': {
        return (
          <>
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-white border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Branch</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Batch</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Expiry Date</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item: any) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-600">{item.branch}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{item.product}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.batch}</td>
                  <td className="px-5 py-3 text-slate-800">{item.qty}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(item.expiry).toLocaleDateString()}</td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getBadgeClass(item.status)}`}>{item.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-400">No data available</td></tr>}
            </tbody>
          </>
        )
      }
      case 'transfer': {
        return (
          <>
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-white border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">From Branch</th><th className="px-5 py-3">To Branch</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item: any) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-600 bg-slate-50">{item.from}</td>
                  <td className="px-5 py-3 font-medium text-indigo-700">{item.to}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{item.product}</td>
                  <td className="px-5 py-3 text-slate-800">{item.qty}</td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getBadgeClass(item.status)}`}>{item.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-400">No data available</td></tr>}
            </tbody>
          </>
        )
      }
      case 'stock':
      default: {
        return (
          <>
            <thead className="text-[11px] text-slate-500 uppercase font-semibold bg-white border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Batch</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Expiry Date</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item: any) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.batch}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{item.product}</td>
                  <td className="px-5 py-3 font-medium text-slate-600">{item.branch}</td>
                  <td className="px-5 py-3 text-slate-800">{item.qty}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(item.expiry).toLocaleDateString()}</td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getBadgeClass(item.status)}`}>{item.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-400">No data available</td></tr>}
            </tbody>
          </>
        )
      }
    }
  }

  const getReportHint = () => {
    switch(activeReport) {
      case 'sales': return 'Excel only · Qtys in units · Excludes currency amounts';
      case 'expiry': return 'Excel only · Filtered by Fresh / Near Expiry / Expired batches';
      case 'transfer': return 'Excel only · Includes all active and history transfers';
      case 'stock':
      default: return 'Excel only · Current snapshot quantities across specific selected branches';
    }
  }



  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Generate Reports</h1>
          <p className="text-slate-500 mt-1">Export data as Excel (.xlsx) — quantities only, no currency values</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportOptions.map((opt) => {
          const isActive = activeReport === opt.id;
          return (
          <Card key={opt.id} onClick={() => setActiveReport(opt.id)} className={`rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all ${isActive ? 'border-indigo-400 shadow-md bg-indigo-50 relative overflow-hidden ring-1 ring-indigo-400' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            {isActive && <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>}
            <div className="mt-1">
              {React.cloneElement(opt.icon as React.ReactElement<any>, { className: isActive ? 'w-6 h-6 text-indigo-500' : 'w-6 h-6 text-slate-400' } as any)}
            </div>
            <div>
              <h3 className={`font-bold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.title}</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isActive ? 'text-indigo-700/80' : 'text-slate-500'}`}>{opt.description}</p>
            </div>
          </Card>
        )})}
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Report Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Branch</label>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
                <option value="All Branches">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name} {b.location ? `- ${b.location}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Type</label>
              <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium">
                <option value="All Products">All Products</option>
                <option value="Milk">Milk</option>
                <option value="Yogurt">Yogurt</option>
                <option value="Cheese">Cheese</option>
                <option value="Butter">Butter</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date From</label>
              <input type="date" className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date To</label>
              <input type="date" className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium" />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-500 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
              {getReportHint()}
            </div>
            <Button onClick={handleDownloadExcel} className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              {reportOptions.find(opt => opt.id === activeReport)?.title} Data Preview
            </h2>
            <div className="text-xs font-medium text-slate-500">Live Backend Feed</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              {renderTableContent()}
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
