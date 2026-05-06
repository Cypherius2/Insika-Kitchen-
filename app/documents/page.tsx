'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Eye, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Download,
  ArrowRightLeft,
  ChefHat
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });
    return () => unsubscribe();
  }, []);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || d.type === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'approved': return <Clock className="text-blue-500" size={16} />;
      case 'draft': return <Clock className="text-gray-400" size={16} />;
      case 'cancelled': return <XCircle className="text-red-500" size={16} />;
      default: return null;
    }
  };

  const convertDocument = async (docId: string, fromType: string, toType: 'invoice' | 'receipt') => {
    if (!confirm(`Convert this ${fromType} to a ${toType}?`)) return;
    
    const convertPromise = (async () => {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        type: toType,
        status: toType === 'receipt' ? 'paid' : 'approved',
        updatedAt: serverTimestamp()
      });
      setSelectedDoc(null);
      return toType;
    })();

    toast.promise(convertPromise, {
      loading: `Converting to ${toType}...`,
      success: (type) => `Successfully converted to ${type}!`,
      error: 'Failed to convert document'
    });
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#7a2b22]">Document History</h1>
          <p className="text-[#3d2b1f]/60">View and manage all quotations, invoices, and receipts.</p>
        </header>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by document number..."
              className="w-full rounded-xl border border-[#3d2b1f]/10 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#7a2b22]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="rounded-xl border border-[#3d2b1f]/10 bg-white px-4 py-3 outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option>All</option>
            <option>Quotation</option>
            <option>Invoice</option>
            <option>Receipt</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#7a2b22]/10 bg-white shadow-sm">
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            <table className="w-full text-left">
            <thead className="bg-[#fdfcf0]/50 text-xs font-bold uppercase tracking-wider text-[#3d2b1f]/40">
              <tr>
                <th className="px-6 py-4">Number</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7a2b22]/5">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="group transition-colors hover:bg-[#fdfcf0]/30">
                  <td className="px-6 py-4 font-bold text-[#7a2b22]">{doc.documentNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-tight
                      ${doc.type === 'quotation' ? 'bg-gray-100 text-gray-600' : ''}
                      ${doc.type === 'invoice' ? 'bg-blue-50 text-blue-600' : ''}
                      ${doc.type === 'receipt' ? 'bg-green-50 text-green-600' : ''}
                    `}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#3d2b1f]/60">
                    {doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'Pending'}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#c4900a]">E{doc.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {getStatusIcon(doc.status)}
                      <span className="capitalize">{doc.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedDoc(doc)}
                      className="rounded-lg p-2 text-[#3d2b1f]/40 transition-colors hover:bg-[#7a2b22]/5 hover:text-[#7a2b22]"
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDocs.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-[#3d2b1f]/40">
              <FileText size={48} className="mb-2" />
              <p>No documents found matching your criteria.</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Document Detail Sidebar */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#7a2b22]/10 p-8">
                <h2 className="font-serif text-2xl font-bold text-[#7a2b22]">Document View</h2>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-full p-2 hover:bg-[#fdfcf0]"
                >
                  <XCircle size={24} className="text-[#3d2b1f]/40" />
                </button>
              </div>

              <div id="printable-document" className="flex-1 overflow-y-auto p-12">
                {/* Print Layout Header */}
                <div className="mb-12 flex justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a2b22] text-white">
                      <ChefHat size={32} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#7a2b22]">Insika Kitchen</h3>
                      <p className="text-sm text-[#3d2b1f]/60">Moneni, Manzini, Eswatini</p>
                      <p className="text-sm text-[#3d2b1f]/60">+268 7992 0708</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs font-bold uppercase text-[#c4900a] font-black tracking-widest">{selectedDoc.type}</h3>
                    <p className="text-2xl font-extrabold text-[#7a2b22]">#{selectedDoc.documentNumber}</p>
                    <p className="text-sm text-[#3d2b1f]/60">
                      {selectedDoc.createdAt?.toDate ? selectedDoc.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mb-12 border-t border-b border-[#7a2b22]/5 py-8">
                  <h4 className="mb-6 text-xs font-black uppercase text-[#3d2b1f]/30 tracking-widest">Order Summary</h4>
                  <table className="w-full">
                    <thead className="text-left text-xs font-black uppercase text-[#3d2b1f]/40 tracking-widest">
                      <tr className="border-b border-[#7a2b22]/5">
                        <th className="pb-4">Item Details</th>
                        <th className="pb-4 text-center">Qty</th>
                        <th className="pb-4 text-right">Price</th>
                        <th className="pb-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7a2b22]/5">
                      {selectedDoc.items.map((item: any, i: number) => (
                        <tr key={i} className="group">
                          <td className="py-5">
                            <p className="font-bold text-[#3d2b1f]">{item.name}</p>
                            <p className="text-[10px] uppercase font-black text-[#c4900a]">SKU: {item.id.slice(0, 8)}</p>
                          </td>
                          <td className="py-5 text-center font-bold text-[#3d2b1f]/60">{item.quantity}</td>
                          <td className="py-5 text-right font-medium text-[#3d2b1f]/60">E{item.price.toFixed(2)}</td>
                          <td className="py-5 text-right font-black text-[#7a2b22]">E{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-72 space-y-4">
                    <div className="flex justify-between text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-tight">
                      <span>Subtotal</span>
                      <span>E{selectedDoc.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-tight">
                      <span>VAT</span>
                      <span>E{selectedDoc.vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#7a2b22]/10 pt-4 text-2xl font-black text-[#7a2b22]">
                      <span className="uppercase text-xs tracking-widest">Total Amount</span>
                      <span>E{selectedDoc.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-16 text-center border-t border-[#7a2b22]/5 pt-8">
                  <p className="font-serif text-xl font-bold text-[#7a2b22]">Thank you for your business!</p>
                  <p className="mt-2 text-xs text-[#3d2b1f]/40 font-black uppercase tracking-widest">Insika Kitchen • Baked with purpose</p>
                </div>
              </div>

              <div className="flex gap-4 border-t border-[#7a2b22]/10 p-8 bg-[#fdfcf0]/30">
                <button 
                  onClick={() => window.print()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#7a2b22]/20 bg-white py-3.5 font-black uppercase tracking-widest text-[#7a2b22] shadow-sm transition-all hover:bg-white/80 active:scale-95"
                >
                  <Download size={18} />
                  Export to PDF
                </button>
                {selectedDoc.type === 'quotation' && (
                  <button 
                    onClick={() => convertDocument(selectedDoc.id, 'quotation', 'invoice')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#c4900a] py-3 font-semibold text-white transition-all hover:bg-[#a67a08]"
                  >
                    <ArrowRightLeft size={18} />
                    Convert to Invoice
                  </button>
                )}
                {selectedDoc.type === 'invoice' && (
                  <button 
                    onClick={() => convertDocument(selectedDoc.id, 'invoice', 'receipt')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#7a2b22] py-3 font-semibold text-white transition-all hover:bg-[#5a1f19]"
                  >
                    <CheckCircle2 size={18} />
                    Mark as Paid (Receipt)
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
