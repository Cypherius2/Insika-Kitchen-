'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePDF } from '@/lib/pdf-gen';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';

export default function DocumentsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });
    return () => unsubscribe();
  }, [profile]);

  if (authLoading) return null;

   if (profile?.role !== 'admin') {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center">
           <div className="h-32 w-32 bg-blue-50 rounded-[3rem] flex items-center justify-center mb-8 text-[#00a2ff] shadow-inner">
              <AlertCircle size={64} strokeWidth={1} />
           </div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 leading-none">Security Restricted</h2>
           <p className="text-gray-500 max-w-sm font-medium leading-relaxed mb-10">
             Your node signature does not have the required clearance level to access the financial matrix.
           </p>
           <button 
             onClick={() => window.location.href = '/'}
             className="px-10 py-4 bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl"
           >
             Return to Hub
           </button>
           <p className="mt-8 text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
             Clearance Type: Standard Node
           </p>
        </div>
      </Shell>
    );
  }

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await updateDoc(doc(db, 'transactions', id), {
        status: 'APPROVED',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSettle = async (id: string) => {
    setIsProcessing(id);
    try {
      await updateDoc(doc(db, 'transactions', id), {
        status: 'PAID',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConvertToInvoice = async (transaction: any) => {
    setIsProcessing(transaction.id);
    const date = new Date().toISOString().split('T')[0];

    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        type: 'INVOICE',
        status: 'PENDING',
        date,
        updatedAt: serverTimestamp()
      });
      
      handleDownload({ ...transaction, type: 'INVOICE', date });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transaction.id}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDownload = (doc: any) => {
    generatePDF({
      type: doc.type,
      number: doc.docId,
      date: doc.date,
      customerName: doc.customerName,
      customerEmail: doc.customerEmail || 'node@miratech.io',
      items: doc.items || [
        { name: 'System Provisioning', quantity: 1, price: doc.total }
      ],
      subtotal: doc.total,
      tax: doc.total * 0, 
      total: doc.total,
      businessName: profile?.businessName || 'MiraTech Industries'
    });
  };

  const filteredDocs = documents.filter(d => 
    (d.docId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (d.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const stats = {
    settled: documents.filter(d => d.status === 'PAID' || d.status === 'COMPLETED').reduce((acc, d) => acc + (d.total || 0), 0),
    pending: documents.filter(d => d.status === 'PENDING').reduce((acc, d) => acc + (d.total || 0), 0),
    failed: documents.filter(d => d.status === 'FAILED' || d.status === 'OVERDUE').reduce((acc, d) => acc + (d.total || 0), 0),
  };

  return (
    <Shell>
      <div className="p-10 space-y-10 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#00a2ff]">
                 <FileText size={16} />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Matrix Repository</p>
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Document Control</h2>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a2ff] transition-colors" size={20} />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Transaction IDs or Nodes..." 
                    className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] text-sm font-medium focus:ring-8 focus:ring-[#00a2ff]/5 focus:border-[#00a2ff] transition-all shadow-sm outline-none" 
                 />
              </div>
           </div>

           <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Settled Sales', value: stats.settled, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Pending Requests', value: stats.pending, icon: Clock, color: 'text-[#00a2ff]', bg: 'bg-blue-50' },
                { label: 'Voids', value: stats.failed, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#00a2ff]/30 transition-all">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
                      <h4 className="text-3xl font-black text-gray-900">${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                   </div>
                   <div className={cn("h-16 w-16 rounded-[1.8rem] flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", stat.bg)}>
                      <stat.icon className={stat.color} size={32} strokeWidth={2.5} />
                   </div>
                </div>
              ))}
           </div>

           <div className="lg:col-span-12 bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              <div className="overflow-x-auto flex-1">
                 {loading ? (
                   <div className="h-full flex flex-col items-center justify-center p-20 gap-4 opacity-30">
                      <Loader2 className="animate-spin text-[#00a2ff]" size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Opening Hub Data...</p>
                   </div>
                 ) : filteredDocs.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center p-20 gap-6 opacity-30 text-center">
                      <div className="h-24 w-24 rounded-[3rem] border-4 border-dashed border-gray-200 flex items-center justify-center">
                         <FileText size={32} className="text-gray-400" />
                      </div>
                      <div>
                         <p className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">Matrix Silent</p>
                         <p className="text-xs font-medium text-gray-500">No transactions recorded today</p>
                      </div>
                   </div>
                 ) : (
                    <table className="w-full">
                       <thead>
                          <tr className="bg-[#fafafa]/30 border-b border-gray-50">
                             <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identifier</th>
                             <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Node</th>
                             <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Value</th>
                             <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                             <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Control</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {filteredDocs.map((doc) => (
                             <tr key={doc.id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="px-10 py-8">
                                   <div className="flex items-center gap-5">
                                      <div className={cn(
                                         "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                         doc.type === 'INVOICE' ? "bg-blue-50 text-[#00a2ff]" :
                                         doc.type === 'QUOTATION' ? "bg-cyan-50 text-cyan-600" :
                                         "bg-emerald-50 text-emerald-600"
                                      )}>
                                         <FileText size={20} />
                                      </div>
                                      <div>
                                         <p className="text-sm font-black text-gray-900 leading-none mb-1">{doc.docId}</p>
                                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">{doc.type}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-10 py-8">
                                   <p className="text-sm font-bold text-gray-900 leading-none mb-1">{doc.customerName || 'Standard User'}</p>
                                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Journal Date: {doc.date}</p>
                                </td>
                                <td className="px-10 py-8">
                                   <p className="text-sm font-black text-gray-900">${(doc.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </td>
                                <td className="px-10 py-8">
                                   <span className={cn(
                                      "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                                      doc.status === 'PAID' || doc.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                      doc.status === 'APPROVED' ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                                      doc.status === 'PENDING' ? "bg-blue-50 text-[#00a2ff] border-blue-100" :
                                      "bg-red-50 text-red-600 border-red-100"
                                   )}>
                                      {doc.status}
                                   </span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                   <div className="flex items-center justify-end gap-3">
                                      {doc.type === 'INVOICE' && doc.status === 'PENDING' && (
                                         <button 
                                            onClick={() => handleSettle(doc.id)}
                                            disabled={isProcessing === doc.id}
                                            className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                                         >
                                            {isProcessing === doc.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                            Settle Order
                                         </button>
                                      )}
                                      {doc.type === 'QUOTATION' && doc.status === 'PENDING' && (
                                         <button 
                                            onClick={() => handleApprove(doc.id)}
                                            disabled={isProcessing === doc.id}
                                            className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                                         >
                                            {isProcessing === doc.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                            Approve
                                         </button>
                                      )}
                                      {doc.type === 'QUOTATION' && doc.status === 'APPROVED' && (
                                         <button 
                                            onClick={() => handleConvertToInvoice(doc)}
                                            disabled={isProcessing === doc.id}
                                            className="px-4 py-2 bg-[#00a2ff] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm"
                                         >
                                            {isProcessing === doc.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                            Convert to Order
                                         </button>
                                      )}
                                      <button 
                                         onClick={() => handleDownload(doc)}
                                         className="h-12 w-12 flex items-center justify-center rounded-2xl text-gray-300 hover:text-[#00a2ff] hover:bg-[#00a2ff]/5 transition-all group/dl"
                                         title="Download Receipt"
                                      >
                                         <Download size={20} className="group-hover/dl:scale-110 transition-transform" />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 )}
              </div>
           </div>
        </div>
      </div>
    </Shell>
  );
}
