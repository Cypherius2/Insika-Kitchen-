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
    
    try {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        type: toType,
        status: toType === 'receipt' ? 'paid' : 'approved',
        updatedAt: serverTimestamp()
      });
      setSelectedDoc(null);
      alert(`Document converted successfully to ${toType}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'documents');
    }
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

        <div className="overflow-hidden rounded-2xl border border-[#7a2b22]/10 bg-white shadow-sm">
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

              <div className="flex-1 overflow-y-auto p-12">
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
                    <h3 className="text-xs font-bold uppercase text-[#c4900a]">{selectedDoc.type}</h3>
                    <p className="text-2xl font-bold text-[#7a2b22]">#{selectedDoc.documentNumber}</p>
                    <p className="text-sm text-[#3d2b1f]/60">
                      {selectedDoc.createdAt?.toDate ? selectedDoc.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mb-12 border-t border-b border-[#7a2b22]/5 py-6">
                  <h4 className="mb-4 text-xs font-bold uppercase text-[#3d2b1f]/40">Items</h4>
                  <table className="w-full">
                    <thead className="text-left text-xs font-bold uppercase text-[#3d2b1f]/60">
                      <tr>
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7a2b22]/5">
                      {selectedDoc.items.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="py-4 font-medium text-[#3d2b1f]">{item.name}</td>
                          <td className="py-4 text-[#3d2b1f]/60">{item.quantity}</td>
                          <td className="py-4 text-[#3d2b1f]/60">E{item.price.toFixed(2)}</td>
                          <td className="py-4 text-right font-bold text-[#3d2b1f]">E{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-60 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#3d2b1f]/60">Subtotal</span>
                      <span className="font-medium">E{selectedDoc.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#3d2b1f]/60">VAT (15%)</span>
                      <span className="font-medium">E{selectedDoc.vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#7a2b22]/10 pt-3 text-xl font-bold text-[#7a2b22]">
                      <span>Total</span>
                      <span>E{selectedDoc.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-[#7a2b22]/10 p-8 bg-[#fdfcf0]/30">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#3d2b1f]/10 bg-white py-3 font-semibold text-[#3d2b1f] transition-all hover:bg-gray-50">
                  <Download size={18} />
                  Download PDF
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
