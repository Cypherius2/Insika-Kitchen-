'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/Shell';
import { useProducts, useCustomers, createDocument } from '@/lib/hooks';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { DocumentPreview } from '@/components/DocumentPreview';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  Receipt, 
  FileText, 
  Quote,
  ShoppingBag,
  ChefHat
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function POSPage() {
  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();
  const { settings, loading: settingsLoading } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [lastCreatedDocument, setLastCreatedDocument] = useState<any | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = settings.vatRate / 100;
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const handleCheckout = async (type: 'quotation' | 'invoice' | 'receipt') => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    
    const items = cart.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }));

    const orderData = {
      type,
      customerId: selectedCustomer,
      items,
      subtotal,
      vat,
      totalAmount: total,
      status: type === 'receipt' ? 'paid' : (type === 'invoice' ? 'approved' : 'draft'),
    };

    const orderPromise = createDocument(orderData);
    
    toast.promise(orderPromise, {
      loading: `Generating ${type}...`,
      success: (result: any) => {
        setCart([]);
        setSelectedCustomer(null);
        setShowCartMobile(false);
        
        // Send Email Notification
        const customer = customers.find(c => c.id === selectedCustomer);
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderData,
            customerEmail: customer?.email,
            ownerEmail: 'mrcypher68@gmail.com',
            documentNumber: result.documentNumber
          })
        }).then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            if (data.status === 'partially_sent') {
              toast.warning('Email sent to owner only. Verify your domain to email customers!', { duration: 6000 });
            } else {
              toast.success('Stunning email sent to client and owner!');
            }
          }
        }).catch(err => {
          console.error('Failed to send email:', err);
        });

        setLastCreatedDocument({ ...orderData, documentNumber: result.documentNumber });
        return `${type.toUpperCase()} #${result.documentNumber} created successfully!`;
      },
      error: 'Failed to process checkout'
    });

    try {
      await orderPromise;
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Helper to add fake products if none exist
  const addSampleProducts = async () => {
    const samples = [
      { name: 'Chicken Samosa (Large)', price: 12.50, category: 'Savory', stock: 100 },
      { name: 'Beef Samosa (Large)', price: 12.50, category: 'Savory', stock: 100 },
      { name: 'Mini Spring Rolls', price: 8.00, category: 'Savory', stock: 150 },
      { name: 'Cocktail Sausages', price: 10.00, category: 'Meaty', stock: 200 },
      { name: 'Chelsea Buns', price: 15.00, category: 'Sweet', stock: 50 },
      { name: 'Milk Tart', price: 45.00, category: 'Sweet', stock: 20 },
    ];

    for (const s of samples) {
      await addDoc(collection(db, 'products'), { ...s, createdAt: serverTimestamp() });
    }
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <Shell>
      <div className="flex h-full flex-col gap-6 lg:h-[calc(100vh-140px)] lg:flex-row">
        {/* Left: Product Selection */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#7a2b22]/10 bg-white shadow-sm lg:flex-[2]">
          <div className="border-b border-[#7a2b22]/5 p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between md:mb-6">
              <h1 className="font-serif text-xl font-bold text-[#7a2b22] md:text-2xl">Menu</h1>
              {products.length === 0 && !productsLoading && (
                <button 
                  onClick={addSampleProducts}
                  className="text-xs font-medium text-[#c4900a] underline md:text-sm"
                >
                  Load Sample Inventory
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40" size={16} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-[#3d2b1f]/10 bg-[#fdfcf0]/20 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#7a2b22]/30 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#7a2b22] text-white' 
                        : 'bg-[#fdfcf0] text-[#3d2b1f]/60 hover:bg-[#7a2b22]/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.button
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-[#3d2b1f]/5 bg-white p-3 text-center transition-all hover:border-[#7a2b22]/20 hover:bg-[#fdfcf0]/30 hover:shadow-lg"
                  >
                    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#fdfcf0] text-[#7a2b22] border border-[#7a2b22]/10">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <ChefHat size={32} className="md:size-10" />
                      )}
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#3d2b1f] line-clamp-1 md:text-sm">{product.name}</div>
                    <div className="text-xs font-black text-[#c4900a] md:text-sm">E{product.price.toFixed(2)}</div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            {filteredProducts.length === 0 && !productsLoading && (
              <div className="flex h-full flex-col items-center justify-center text-[#3d2b1f]/40">
                <ShoppingBag size={48} className="mb-2" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout (Sidebar on desktop, drawer on mobile) */}
        <AnimatePresence>
          {(showCartMobile || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.div 
              initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { y: '100%' } : { opacity: 0, x: 20 }}
              animate={typeof window !== 'undefined' && window.innerWidth < 1024 ? { y: 0 } : { opacity: 1, x: 0 }}
              exit={typeof window !== 'undefined' && window.innerWidth < 1024 ? { y: '100%' } : { opacity: 0, x: 20 }}
              className={`fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl lg:relative lg:inset-auto lg:z-0 lg:flex lg:w-[400px] lg:rounded-2xl lg:border lg:border-[#7a2b22]/10 lg:shadow-sm`}
            >
              <div className="flex items-center justify-between border-b border-[#7a2b22]/5 p-6 bg-[#7a2b22] text-white lg:bg-white lg:text-[#7a2b22]">
                <h2 className="font-serif text-xl font-bold">Order Details</h2>
                <button 
                  onClick={() => setShowCartMobile(false)}
                  className="rounded-full bg-white/20 p-2 lg:hidden"
                >
                  <Minus size={20} />
                </button>
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-[#3d2b1f]/30">
                    <ShoppingBag size={40} className="mb-2" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border-b border-[#7a2b22]/5 pb-4">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#3d2b1f]">{item.name}</p>
                          <p className="text-xs font-medium text-[#c4900a]">E{item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-[#fdfcf0] p-1.5 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="rounded-lg bg-white p-1 text-[#7a2b22] shadow-sm transition-all active:scale-90"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="rounded-lg bg-white p-1 text-[#7a2b22] shadow-sm transition-all active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Selection */}
              <div className="border-t border-[#7a2b22]/5 bg-[#fdfcf0]/30 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-[#3d2b1f]/40">Customer Selection</label>
                </div>
                
                <div className="relative group">
                  <select 
                    className="w-full appearance-none rounded-xl border border-[#3d2b1f]/10 bg-white px-4 py-3 text-sm font-bold text-[#3d2b1f] outline-none ring-[#7a2b22]/10 transition-all focus:ring-4"
                    value={selectedCustomer || ''}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40">
                    <Search size={16} />
                  </div>
                </div>
                
                {selectedCustomerData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-lg border border-[#c4900a]/20 bg-[#c4900a]/5 p-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c4900a] text-white">
                      <span className="text-xs font-bold">{selectedCustomerData.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#3d2b1f]">{selectedCustomerData.name}</p>
                      <p className="text-[10px] text-[#3d2b1f]/60">{selectedCustomerData.email || 'No email'}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Totals & Actions */}
              <div className="bg-[#1a120b] p-6 text-white">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span className="font-bold">E{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>VAT ({settings.vatRate}%)</span>
                    <span className="font-bold">E{vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-black text-white">
                    <span>Order Total</span>
                    <span>E{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-4 gap-2">
                  <button
                    disabled={cart.length === 0 || isCheckingOut}
                    onClick={() => handleCheckout('quotation')}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-4 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-30"
                  >
                    <Quote size={20} />
                    <span className="text-[10px] font-black uppercase">Quote</span>
                  </button>
                  <button
                    disabled={cart.length === 0 || isCheckingOut}
                    onClick={() => handleCheckout('invoice')}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-4 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-30"
                  >
                    <FileText size={20} />
                    <span className="text-[10px] font-black uppercase">Invoice</span>
                  </button>
                  <button
                    disabled={cart.length === 0 || isCheckingOut}
                    onClick={() => handleCheckout('receipt')}
                    className="col-span-2 flex items-center justify-center gap-3 rounded-xl bg-white py-4 font-black transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-30"
                  >
                    <Receipt size={22} className="text-[#1a120b]" />
                    <span className="text-sm uppercase tracking-widest text-[#1a120b]">Pay Now</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Button for Mobile */}
        <div className="fixed bottom-24 right-6 z-40 lg:hidden">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCartMobile(true)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7a2b22] text-white shadow-2xl"
          >
            <div className="relative">
              <ShoppingBag size={28} />
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c4900a] text-[10px] font-black ring-2 ring-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {lastCreatedDocument && (
            <DocumentPreview 
              document={lastCreatedDocument} 
              onClose={() => setLastCreatedDocument(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}
