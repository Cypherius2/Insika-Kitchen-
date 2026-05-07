'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  ChevronDown,
  Clock,
  ArrowRight
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentPreview } from '@/components/DocumentPreview';
import { useSettings } from '@/lib/hooks';
import { useAuth } from '@/lib/contexts/AuthContext';

export const dynamic = 'force-dynamic';

export default function DocumentsPage() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!db || !user) {
        if (!user) setLoading(false);
        return;
    }
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));
    return () => unsubscribe();
  }, [user]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.documentNumber.includes(searchTerm) || 
                          doc.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || doc.type === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleOpenPreview = (doc: any) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold" style={{ color: settings.brandColor }}>Document Records</h1>
            <p className="text-[#3d2b1f]/60">Manage invoices, receipts, and quotations in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-widest"
              style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}0D` }}
            >
              <Clock size={16} />
              Real-time Sync
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={20} />
            <input 
              type="text" 
              placeholder="Search by ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border bg-white py-4 pl-12 pr-4 font-medium outline-none transition-all focus:ring-4 shadow-sm"
              style={{ borderColor: `${settings.brandColor}1A` }}
            />
          </div>
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={18} />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full appearance-none rounded-2xl border bg-white py-4 pl-12 pr-10 font-medium outline-none transition-all focus:ring-4 shadow-sm"
                style={{ borderColor: `${settings.brandColor}1A` }}
              >
                <option value="All">All Documents</option>
                <option value="Invoice">Invoices</option>
                <option value="Receipt">Receipts</option>
                <option value="Quotation">Quotations</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={18} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-3xl border bg-white shadow-xl shadow-[#7a2b22]/5" style={{ borderColor: `${settings.brandColor}1A` }}>
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#fdfcf0]/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-8" style={{ color: `${settings.brandColor}66` }}>
                <tr>
                  <th className="px-8 py-5">Number</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Customer</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5 text-right">Total</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: `${settings.brandColor}0D` }}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="h-4 w-16 rounded bg-gray-100" /></td>
                      <td className="px-6 py-6"><div className="h-6 w-20 rounded-full bg-gray-100" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-32 rounded bg-gray-100" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-24 rounded bg-gray-100" /></td>
                      <td className="px-6 py-6"><div className="ml-auto h-4 w-12 rounded bg-gray-100" /></td>
                      <td className="px-8 py-6"></td>
                    </tr>
                  ))
                ) : filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="group transition-colors hover:bg-[#fdfcf0]/30">
                      <td className="px-8 py-6">
                        <span className="font-black text-[#3d2b1f]">#{doc.documentNumber}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                          doc.type === 'invoice' ? 'bg-blue-50 text-blue-600' : 
                          doc.type === 'receipt' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        )}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-bold text-[#3d2b1f]">{doc.customer?.name || 'Walk-in'}</p>
                        <p className="text-[10px] font-bold text-[#3d2b1f]/30 uppercase tracking-widest">{doc.customer?.phone || 'No Phone'}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#3d2b1f]/60">
                          <Clock size={14} className="text-[#3d2b1f]/20" />
                          {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), 'dd MMM yyyy') : 'Recent'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="font-black text-[#3d2b1f]">E{doc.totalAmount?.toFixed(2)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleOpenPreview(doc)}
                          className="rounded-xl p-2 transition-all hover:text-white"
                          style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}0D` }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = settings.brandColor;
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `${settings.brandColor}0D`;
                            e.currentTarget.style.color = settings.brandColor;
                          }}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <FileText className="mx-auto mb-4 opacity-10" size={48} />
                      <p className="text-lg font-bold text-[#3d2b1f]/40">No documents found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DocumentPreview 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={selectedDoc}
      />
    </Shell>
  );
}
