'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { 
  Zap, 
  ShoppingCart, 
  Trash2, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  ChevronLeft,
  CircleDollarSign,
  Maximize2,
  CheckCircle2,
  Minus,
  Plus,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { generatePDF } from '@/lib/pdf-gen';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType, createNotification } from '@/lib/firestore-utils';

export default function POSPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, [profile]);

  const addToCart = (product: any) => {
    setCart(currentCart => {
      const existing = currentCart.find(item => item.id === product.id);
      if (existing) {
        return currentCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(current => current.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const handleDocumentAction = async (type: 'RECEIPT' | 'INVOICE' | 'QUOTATION', sendEmail = false) => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    
    const docId = `${type === 'RECEIPT' ? 'REC' : type === 'INVOICE' ? 'INV' : 'QUO'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const email = 'client.node@miratech.io';
    const date = new Date().toISOString().split('T')[0];

    // Save transaction to Firestore
    try {
      await addDoc(collection(db, 'transactions'), {
        docId,
        type,
        customerName: 'Standard Entity',
        customerEmail: email,
        total,
        status: type === 'QUOTATION' ? 'PENDING' : 'COMPLETED',
        date,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await createNotification(
        `Transaction Logged: ${docId}`,
        `${type} generated for Standard Entity. Total Settlement: $${total.toFixed(2)}.`,
        type === 'QUOTATION' ? 'INFO' : 'SUCCESS'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }

    await new Promise(r => setTimeout(r, 600));

    generatePDF({
      type,
      number: docId,
      date,
      customerName: 'Standard Entity',
      customerEmail: email,
      items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      subtotal,
      tax,
      total,
      businessName: profile?.businessName || 'MiraTech Industries'
    });

    if (sendEmail) {
      setLastEmailSent(email);
      setTimeout(() => setLastEmailSent(null), 4000);
    }

    setIsProcessing(false);
    if (type === 'RECEIPT') {
      setShowSuccess(true);
      setCart([]);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <Shell>
      <div className="min-h-full flex flex-col lg:flex-row bg-[#fafafa]">
        {/* Product Grid */}
        <div className="flex-1 p-6 lg:p-10 space-y-8 lg:space-y-10">
           <header className="flex items-center justify-between">
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-[#00a2ff]">
                    <Zap size={14} className="fill-current" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Protocol</p>
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Terminal Alpha-01</h2>
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hub Link: Active</span>
                 </div>
              </div>
           </header>

           <div className="grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {loading ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center gap-4 opacity-30">
                   <Loader2 className="animate-spin text-[#00a2ff]" size={48} />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Downloading Logic Patterns...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center gap-6 opacity-30 text-center">
                   <div className="h-24 w-24 rounded-[3rem] border-4 border-dashed border-gray-200 flex items-center justify-center">
                      <Zap size={32} className="text-gray-400" />
                   </div>
                   <div>
                      <p className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">No Active Modules</p>
                      <p className="text-xs font-medium text-gray-500">Add products in Inventory to populate the terminal</p>
                   </div>
                </div>
              ) : (
                products.map((product) => (
                  <button 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-left transition-all hover:shadow-2xl hover:-translate-y-2 group active:scale-95"
                  >
                    <div className="h-32 w-full rounded-2xl bg-gray-50 mb-6 flex items-center justify-center text-gray-300 group-hover:scale-110 group-hover:text-[#00a2ff] transition-all overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#00a2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Zap size={48} className="relative z-10" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">{product.category}</p>
                    <h3 className="text-sm font-black text-gray-900 mb-3 truncate leading-none">{product.name}</h3>
                    <p className="text-base font-black text-[#00a2ff] tracking-tight leading-none">${product.price.toFixed(2)}</p>
                  </button>
                ))
              )}
           </div>
        </div>

        {/* Cart Sidebar */}
        <aside className="w-full lg:w-[450px] bg-white border-l border-gray-100 flex flex-col shadow-2xl relative z-20">
           <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-[#fafafa]/50">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center shadow-lg relative">
                    <ShoppingCart size={20} />
                    {cart.length > 0 && (
                       <span className="absolute -top-2 -right-2 h-6 w-6 bg-[#00a2ff] text-white text-[10px] font-black rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                          {cart.length}
                       </span>
                    )}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Queue Matrix</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Ref: #TK-29402</p>
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-10 space-y-6">
              <AnimatePresence>
                {lastEmailSent && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 mb-4"
                  >
                    <Mail className="text-emerald-500" size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Document Transmitted to {lastEmailSent}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <div className="h-24 w-24 rounded-[2rem] border-4 border-dashed border-gray-200 flex items-center justify-center">
                       <ShoppingCart size={32} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Cart Node Empty</p>
                 </div>
              ) : (
                cart.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between group animate-in slide-in-from-right-4 duration-300 bg-white p-4 rounded-[2rem] border border-transparent hover:border-gray-100 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-5">
                       <div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#00a2ff] group-hover:text-white transition-all duration-500 shadow-inner">
                          <Zap size={24} />
                       </div>
                       <div className="flex flex-col gap-1">
                          <p className="text-sm font-black text-gray-900 leading-tight truncate max-w-[160px]">{item.name}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-[11px] font-black text-[#00a2ff] tracking-tighter leading-none">${item.price.toFixed(2)}</p>
                            
                            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                               <button 
                                 onClick={() => updateQuantity(item.id, -1)} 
                                 className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all active:scale-90"
                               >
                                 <Minus size={12} />
                               </button>
                               <div className="w-8 text-center flex items-center justify-center overflow-hidden">
                                 <AnimatePresence mode="wait">
                                   <motion.span 
                                     key={item.quantity}
                                     initial={{ y: 5, opacity: 0 }}
                                     animate={{ y: 0, opacity: 1 }}
                                     exit={{ y: -5, opacity: 0 }}
                                     className="text-xs font-black text-gray-900"
                                   >
                                     {item.quantity}
                                   </motion.span>
                                 </AnimatePresence>
                               </div>
                               <button 
                                 onClick={() => updateQuantity(item.id, 1)} 
                                 className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all active:scale-90"
                               >
                                 <Plus size={12} />
                               </button>
                            </div>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="h-10 w-10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-40 group-hover:opacity-100"
                      title="Remove from Matrix"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
           </div>

           <div className="p-10 bg-[#fafafa]/80 border-t border-gray-50 backdrop-blur-md">
              <div className="space-y-4 mb-8">
                 <div className="flex justify-between items-center text-gray-400 font-bold">
                    <span className="text-xs uppercase tracking-widest">Subtotal Matrix</span>
                    <span className="text-sm">${subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-400 font-bold">
                    <span className="text-xs uppercase tracking-widest">Tax Relay (15%)</span>
                    <span className="text-sm">${tax.toFixed(2)}</span>
                 </div>
                 <div className="pt-4 border-t border-gray-200 flex justify-between items-center mt-4">
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-gray-900">Total Settlement</span>
                    <span className="text-3xl font-black text-gray-900 tracking-tighter">${total.toFixed(2)}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                 <button 
                   onClick={() => handleDocumentAction('QUOTATION')}
                   className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-gray-100 bg-white text-gray-500 hover:text-[#00a2ff] hover:bg-[#00a2ff]/5 transition-all text-[9px] font-black uppercase tracking-widest"
                 >
                    <FileText size={14} /> Quote
                 </button>
                 <button 
                   onClick={() => handleDocumentAction('INVOICE')}
                   className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-gray-100 bg-white text-gray-500 hover:text-[#00a2ff] hover:bg-[#00a2ff]/5 transition-all text-[9px] font-black uppercase tracking-widest"
                 >
                    <FileText size={14} /> Invoice
                 </button>
              </div>

              <button 
                onClick={() => handleDocumentAction('INVOICE', true)}
                className="w-full mb-3 flex items-center justify-center gap-2 py-4 rounded-2xl border border-emerald-500/10 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 transition-all text-[9px] font-black uppercase tracking-widest"
              >
                <Mail size={14} /> Document via Email
              </button>

              <div className="grid grid-cols-2 gap-3">
                 <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-gray-100 bg-white hover:border-[#00a2ff] hover:bg-[#00a2ff]/5 transition-all group overflow-hidden relative">
                    <div className="relative z-10 text-center">
                       <CreditCard size={24} className="text-gray-400 group-hover:text-[#00a2ff] transition-colors mb-2 mx-auto" />
                       <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900">Digital Link</span>
                    </div>
                 </button>
                 <button 
                    onClick={() => handleDocumentAction('RECEIPT')}
                    disabled={cart.length === 0 || isProcessing}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                      showSuccess ? "bg-emerald-500 shadow-emerald-500/20" : "bg-[#0a0a0a] hover:bg-black shadow-black/20"
                    )}
                 >
                    {isProcessing ? (
                      <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full mb-2" />
                    ) : showSuccess ? (
                      <CheckCircle2 size={24} className="text-white mb-2" />
                    ) : (
                      <Banknote size={24} className="text-white mb-2" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                      {isProcessing ? 'Linking...' : showSuccess ? 'Settled' : 'Settlement'}
                    </span>
                 </button>
              </div>
           </div>
        </aside>
      </div>
    </Shell>
  );
}
