'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, Receipt, FileText, Quote, ChefHat, CheckCircle2 } from 'lucide-react';

interface DocumentPreviewProps {
  document: any;
  onClose: () => void;
}

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const { type, items, totalAmount, subtotal, vat, documentNumber, createdAt } = document;
  
  const accentColor = type === 'receipt' ? 'bg-emerald-600' : 'bg-[#7a2b22]';
  const Icon = type === 'receipt' ? Receipt : (type === 'invoice' ? FileText : Quote);
  const statusLabel = type === 'receipt' ? 'Payment Successful' : (type === 'invoice' ? 'Invoice Generated' : 'Quotation Issued');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a120b]/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Dynamic Header */}
        <div className={`p-8 text-white ${accentColor} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Icon size={28} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">{type}</h2>
              <p className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                <CheckCircle2 size={12} />
                {statusLabel}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
          >
            <X size={24} />
          </button>
        </div>

        <div id="printable-document" className="p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
          <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#7a2b22]">
                <ChefHat size={32} />
                <h1 className="font-serif text-3xl font-black">Insika Kitchen</h1>
              </div>
              <p className="mt-1 text-sm text-[#3d2b1f]/40 font-bold">The Home of Fresh Bakes</p>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-black uppercase tracking-widest text-[#3d2b1f]/40">Document ID</p>
              <p className="text-xl font-black text-[#3d2b1f]">#{documentNumber}</p>
              <p className="mt-1 text-sm font-bold text-[#c4900a]">
                {createdAt?.toDate ? createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          <div className="border-y border-[#7a2b22]/5 py-6">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-[#3d2b1f]/40">
                  <th className="pb-4">Quantity & Item</th>
                  <th className="pb-4 text-right">Unit Price</th>
                  <th className="pb-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7a2b22]/5">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="group">
                    <td className="py-4">
                      <p className="text-sm font-bold text-[#3d2b1f]">{item.name}</p>
                      <p className="text-xs text-[#3d2b1f]/40 uppercase font-bold tracking-tighter">Qty: {item.quantity}</p>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-medium text-[#3d2b1f]/60">E{item.price.toFixed(2)}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-black text-[#3d2b1f]">E{item.total.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-tight">
                <span>Subtotal</span>
                <span>E{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-tight">
                <span>VAT</span>
                <span>E{vat.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between rounded-2xl p-4 text-white ${accentColor}`}>
                <span className="text-lg font-black uppercase">Total Due</span>
                <span className="text-2xl font-black">E{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="font-serif text-lg font-bold text-[#7a2b22]">Thank you for your patronage!</p>
            <p className="mt-1 text-xs text-[#3d2b1f]/40 font-bold uppercase tracking-widest">Insika Kitchen • Baked with purpose</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[#7a2b22]/5 bg-[#fdfcf0]/50 p-6 flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex-1 rounded-xl border border-[#7a2b22]/20 bg-white py-3 text-sm font-black uppercase tracking-widest text-[#7a2b22] shadow-sm transition-all hover:bg-[#7a2b22]/5 active:scale-95"
          >
            Download PDF
          </button>
          <button 
            onClick={onClose}
            className={`flex-1 rounded-xl py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${accentColor}`}
          >
            Close Receipt
          </button>
        </div>
      </motion.div>
    </div>
  );
}
