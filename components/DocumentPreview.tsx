'use client';

import React from 'react';
import { ChefHat, Download, FileText, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendDocumentEmail } from '@/lib/email';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

import { useSettings } from '@/lib/hooks';

export function DocumentPreview({ isOpen, onClose, document: docData }: DocumentPreviewProps) {
  const { settings } = useSettings();
  if (!docData) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    documentNumber,
    type,
    customer,
    items = [],
    subtotal = 0,
    vat = 0,
    totalAmount = 0,
    createdAt,
    businessName: docBusinessName,
    logoUrl: docLogoUrl
  } = docData;

  const brandColor = settings.brandColor || '#7a2b22';
  const businessName = docBusinessName || settings.businessName || 'Insika Kitchen';
  const logoUrl = docLogoUrl || settings.logoUrl;

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const accentColor = type === 'receipt' ? 'bg-green-600' : type === 'invoice' ? 'bg-blue-600' : 'bg-[#c4900a]';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-[#3d2b1f]/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:inset-y-10"
          >
            <div className="flex h-16 items-center justify-between border-b border-[#7a2b22]/5 bg-[#fdfcf0]/50 px-8">
              <div className="flex items-center gap-3">
                <FileText className="text-[#3d2b1f]/40" size={20} />
                <span className="text-sm font-black uppercase tracking-widest text-[#3d2b1f]/60">Document Preview</span>
              </div>
              <div className="flex items-center gap-2">
                {customer?.email && (
                  <button 
                    onClick={() => sendDocumentEmail(customer.email, documentNumber, type, {
                      items,
                      subtotal,
                      vat,
                      total: totalAmount,
                      settings,
                      customer
                    })}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest bg-white border-2 transition-all active:scale-95 no-print"
                    style={{ borderColor: `${brandColor}1A`, color: brandColor }}
                  >
                    <Mail size={14} />
                    Send Email
                  </button>
                )}
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 no-print"
                  style={{ backgroundColor: brandColor }}
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <button 
                  onClick={onClose}
                  className="rounded-full p-2 text-[#3d2b1f]/40 hover:bg-[#7a2b22]/5 hover:text-[#7a2b22] no-print"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div id="printable-document" className="h-full overflow-y-auto p-12 pb-32 no-scrollbar">
              <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#7a2b22]/5">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <ChefHat size={40} style={{ color: brandColor }} />
                      )}
                    </div>
                    <div>
                      <span className="font-serif text-3xl font-black" style={{ color: brandColor }}>{businessName}</span>
                      <p className="text-xs font-bold text-[#3d2b1f]/40 uppercase tracking-widest">Home of Fresh Bakes & Culinary Excellence</p>
                    </div>
                  </div>
                  <p className="mt-6 text-xs font-bold text-[#3d2b1f]/60 uppercase tracking-widest leading-relaxed">
                    Mbabane, Eswatini<br />
                    +268 7600 0000<br />
                    insika.kitchen@gmail.com
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className={cn("inline-block rounded-xl px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2", accentColor)}>
                    {typeLabel}
                  </div>
                  <p className="text-4xl font-black text-[#3d2b1f]">#{documentNumber}</p>
                  <p className="mt-1 text-sm font-bold text-[#3d2b1f]/40">
                    {createdAt?.toDate ? createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              <div className="mb-12 grid grid-cols-2 gap-8 border-y py-8" style={{ borderColor: `${brandColor}10` }}>
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#3d2b1f]/30">Bill To</p>
                  <p className="text-lg font-black text-[#3d2b1f]">{customer?.name || 'Walk-in Customer'}</p>
                  <p className="text-sm font-bold text-[#3d2b1f]/60">{customer?.phone}</p>
                  <p className="text-sm font-bold text-[#3d2b1f]/60">{customer?.email}</p>
                </div>
                <div className="text-right">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#3d2b1f]/30">Payment Method</p>
                  <p className="text-sm font-black text-[#3d2b1f] uppercase tracking-widest">Cash / Mobile Money</p>
                </div>
              </div>

              <table className="mb-12 w-full">
                <thead>
                  <tr className="border-b-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#3d2b1f]" style={{ borderBottomColor: brandColor }}>
                    <th className="pb-4 text-left">Description</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-right">Price</th>
                    <th className="pb-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: `${brandColor}05` }}>
                  {items.map((item: any, i: number) => (
                    <tr key={i} className="text-sm">
                      <td className="py-5 font-bold text-[#3d2b1f]">{item.name}</td>
                      <td className="py-5 text-center font-bold text-[#3d2b1f]/60">{item.quantity}</td>
                      <td className="py-5 text-right font-bold text-[#3d2b1f]/60">E{item.price.toFixed(2)}</td>
                      <td className="py-5 text-right font-black text-[#3d2b1f]">E{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto w-full max-w-xs space-y-3">
                <div className="flex justify-between text-sm font-bold text-[#3d2b1f]/60">
                  <span>Subtotal</span>
                  <span>E{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-tight">
                  <span>VAT</span>
                  <span>E{vat.toFixed(2)}</span>
                </div>
                <div className={cn("flex justify-between rounded-2xl p-4 text-xl font-black text-white", accentColor)}>
                  <span>Total</span>
                  <span>E{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-20 border-t pt-8 text-center" style={{ borderTopColor: `${brandColor}10` }}>
                <p className="font-serif text-lg font-black" style={{ color: brandColor }}>Thank you for your business!</p>
                <p className="mt-1 text-xs font-bold text-[#3d2b1f]/40 uppercase tracking-widest">Eat Fresh, Stay Happy</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
