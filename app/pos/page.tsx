'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  User, 
  ChevronRight,
  TrendingUp,
  ReceiptText,
  FileText,
  X,
  CreditCard,
  Banknote,
  CheckCircle2,
  Package,
  Download,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { useProducts, useCustomers, useSettings } from '@/lib/hooks';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DocumentPreview } from '@/components/DocumentPreview';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const { products, loading: productsLoading } = useProducts();
  const { customers } = useCustomers();
  const { settings } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [newCustomerState, setNewCustomerState] = useState({ name: '', phone: '' });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vatRate = settings.vatRate / 100;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerState.name || !db) return;
    setIsSubmittingCustomer(true);
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...newCustomerState,
        createdAt: serverTimestamp()
      });
      const customer = { id: docRef.id, ...newCustomerState };
      setSelectedCustomer(customer);
      setIsAddCustomerModalOpen(false);
      setNewCustomerState({ name: '', phone: '' });
      toast.success('Customer added and selected');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
      toast.error('Failed to add customer');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleCheckout = async (type: 'receipt' | 'invoice' | 'quotation') => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    const documentNumber = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const orderData = {
        documentNumber,
        type,
        customer: selectedCustomer || { name: 'Walk-in Customer' },
        businessName: settings.businessName,
        logoUrl: settings.logoUrl,
        items: cart,
        subtotal,
        vat: vatAmount,
        totalAmount: total,
        createdAt: serverTimestamp(),
        status: type === 'quotation' ? 'pending' : 'completed'
      };

      const docRef = await addDoc(collection(db, 'documents'), orderData);
      
      // Update stock levels (Skip for quotations)
      if (type !== 'quotation') {
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        }
      }

      setLastOrder({ ...orderData, id: docRef.id });
      setCart([]);
      setSelectedCustomer(null);
      setShowSuccessModal(true);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`);
    } catch (error) {
      console.error('Checkout error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'checkout');
      toast.error('Failed to process transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-220px)] md:h-[calc(100vh-240px)] gap-6 lg:flex-row mb-12">
        {/* Product Selection Area */}
        <div className="flex flex-col flex-1 gap-6 min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
            <h1 className="font-serif text-3xl font-bold" style={{ color: settings.brandColor }}>Point of Sale</h1>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={20} />
              <input 
                type="text" 
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border bg-white py-3.5 pl-12 pr-4 font-bold outline-none transition-all focus:ring-2 focus:ring-[#7a2b22]/5 shadow-sm"
                style={{ borderColor: `${settings.brandColor}15` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {productsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-white p-4 h-48 border border-[#7a2b22]/5" />
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className="group relative flex flex-col items-start rounded-2xl bg-white p-4 shadow-sm border transition-all hover:shadow-lg"
                    style={{ borderColor: `${settings.brandColor}05` }}
                  >
                    <div className="mb-3 relative w-full aspect-square rounded-xl bg-[#7a2b22]/5 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <Package className="text-[#3d2b1f]/20" size={24} />
                      )}
                      {product.stock < 10 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full">Low Stock</div>
                      )}
                    </div>
                    <p className="font-bold text-[#3d2b1f] text-sm line-clamp-1">{product.name}</p>
                    <div className="mt-1 flex items-center justify-between w-full">
                      <p className="font-black" style={{ color: settings.brandColor }}>E{product.price.toFixed(2)}</p>
                      <span className="text-[10px] font-black uppercase text-[#3d2b1f]/30">{product.category}</span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <Package className="mx-auto mb-4 opacity-10" size={48} />
                  <p className="font-bold text-[#3d2b1f]/40">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart & Checkout Area */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="flex-1 flex flex-col overflow-hidden rounded-3xl bg-[#3d2b1f] text-white shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-white/40" size={20} />
                <h2 className="text-lg font-black uppercase tracking-widest">Your Cart</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">{cart.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="group relative flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/5 transition-colors hover:bg-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-xs font-black text-white/40">E{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="rounded-lg bg-white/10 p-1 hover:bg-white/20 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-4 text-center text-sm font-black">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="rounded-lg bg-white/10 p-1 hover:bg-white/20 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 rounded-lg p-1 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-20">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-bold">Your cart is empty</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-black/20 space-y-3">
              <div className="flex justify-between text-sm font-bold opacity-60">
                <span>Subtotal</span>
                <span>E{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold opacity-40 uppercase tracking-widest text-xs">
                <span>VAT ({settings.vatRate}%)</span>
                <span>E{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-2xl font-black">
                <span>Total</span>
                <span className="text-[#fdfcf0]">E{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 pt-0 space-y-3 mt-auto pb-10">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <select 
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
                    className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 py-3.5 pl-12 pr-4 text-sm font-bold outline-none ring-offset-[#3d2b1f] focus:ring-2 focus:ring-white/20"
                  >
                    <option value="" className="bg-[#3d2b1f]">Walk-in Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#3d2b1f]">{c.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="rounded-xl bg-white/5 border border-white/10 px-4 transition-all hover:bg-white/10"
                  title="Add New Customer"
                >
                  <UserPlus size={18} className="text-white/60" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handleCheckout('quotation')}
                  disabled={isProcessing || cart.length === 0}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/5 py-4 font-black uppercase transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                >
                  <FileText size={18} />
                  <span className="text-[10px] tracking-widest">Quote</span>
                </button>
                <button 
                  onClick={() => handleCheckout('receipt')}
                  disabled={isProcessing || cart.length === 0}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 py-4 font-black uppercase transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
                >
                  <CreditCard size={18} />
                  <span className="text-[10px] tracking-widest">Receipt</span>
                </button>
                <button 
                  onClick={() => handleCheckout('invoice')}
                  disabled={isProcessing || cart.length === 0}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl py-4 font-black uppercase shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: settings.brandColor, boxShadow: `0 8px 20px ${settings.brandColor}33` }}
                >
                  <Banknote size={18} />
                  <span className="text-[10px] tracking-widest">Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#3d2b1f]/80 backdrop-blur-md"
              onClick={() => setShowSuccessModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                  <CheckCircle2 size={48} className="animate-in zoom-in duration-500" />
                </div>
              </div>
              <h2 className="font-serif text-3xl font-black" style={{ color: settings.brandColor }}>Order Successful</h2>
              <p className="mt-2 text-[#3d2b1f]/60 font-medium">Document #{lastOrder?.documentNumber} has been generated.</p>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95"
                  style={{ backgroundColor: settings.brandColor, boxShadow: `0 8px 20px ${settings.brandColor}33` }}
                >
                  <Download size={20} />
                  Download PDF
                </button>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#7a2b22]/5 py-4 font-black uppercase tracking-widest transition-all active:scale-95"
                  style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}0D` }}
                >
                  <ArrowLeft size={20} />
                  Back to POS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddCustomerModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black" style={{ color: settings.brandColor }}>Quick Register</h2>
                <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-[#3d2b1f]/20 hover:text-black">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Client Name</label>
                  <input 
                    required
                    type="text"
                    value={newCustomerState.name}
                    onChange={(e) => setNewCustomerState({...newCustomerState, name: e.target.value})}
                    placeholder="Enter name"
                    className="w-full rounded-2xl border bg-gray-50 p-4 font-bold outline-none"
                    style={{ borderColor: `${settings.brandColor}1A` }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Phone (Optional)</label>
                  <input 
                    type="tel"
                    value={newCustomerState.phone}
                    onChange={(e) => setNewCustomerState({...newCustomerState, phone: e.target.value})}
                    placeholder="+268 ..."
                    className="w-full rounded-2xl border bg-gray-50 p-4 font-bold outline-none"
                    style={{ borderColor: `${settings.brandColor}1A` }}
                  />
                </div>
                <button 
                  disabled={isSubmittingCustomer}
                  type="submit"
                  className="w-full rounded-2xl py-4 font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: settings.brandColor, boxShadow: `0 10px 30px ${settings.brandColor}33` }}
                >
                  {isSubmittingCustomer ? 'Saving...' : 'Add & Select'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden container for printing */}
      <div className="hidden">
        <DocumentPreview 
          isOpen={true} 
          onClose={() => {}} 
          document={lastOrder} 
        />
      </div>
    </Shell>
  );
}
