'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/Shell';
import { useProducts, useCustomers, createDocument } from '@/lib/hooks';
import { motion, AnimatePresence } from 'motion/react';
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
  const vat = subtotal * 0.15; // 15% VAT
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

    try {
      const result = await createDocument(orderData);
      if (result) {
        setCart([]);
        setSelectedCustomer(null);
        alert(`${type.toUpperCase()} Created: ${result.documentNumber}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to process checkout');
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

  return (
    <Shell>
      <div className="flex h-[calc(100vh-140px)] gap-6">
        {/* Left: Product Selection */}
        <div className="flex flex-[2] flex-col overflow-hidden rounded-2xl border border-[#7a2b22]/10 bg-white shadow-sm">
          <div className="border-b border-[#7a2b22]/5 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold text-[#7a2b22]">Products</h1>
              {products.length === 0 && !productsLoading && (
                <button 
                  onClick={addSampleProducts}
                  className="text-sm font-medium text-[#c4900a] underline"
                >
                  Load Sample Inventory
                </button>
              )}
            </div>
            
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-[#3d2b1f]/10 py-2 pl-10 pr-4 outline-none focus:border-[#7a2b22]/30"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="rounded-lg border border-[#3d2b1f]/10 px-4 py-2 outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.button
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-[#3d2b1f]/5 p-4 text-center transition-all hover:border-[#7a2b22]/20 hover:bg-[#fdfcf0]/30 hover:shadow-md"
                  >
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-[#fdfcf0] text-[#7a2b22] border border-[#7a2b22]/10">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ChefHat size={40} />
                      )}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[#3d2b1f] line-clamp-1">{product.name}</div>
                    <div className="text-sm font-bold text-[#c4900a]">E{product.price.toFixed(2)}</div>
                    <div className="text-[10px] text-[#3d2b1f]/40">Stock: {product.stock || 0}</div>
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

        {/* Right: Cart & Checkout */}
        <div className="flex w-[400px] flex-col overflow-hidden rounded-2xl border border-[#7a2b22]/10 bg-white shadow-sm">
          <div className="border-b border-[#7a2b22]/5 p-6">
            <h2 className="font-serif text-xl font-bold text-[#7a2b22]">Order Details</h2>
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
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#3d2b1f]">{item.name}</p>
                      <p className="text-xs text-[#c4900a]">E{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[#fdfcf0] p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="rounded-md bg-white p-1 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="rounded-md bg-white p-1 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Selection */}
          <div className="border-t border-[#7a2b22]/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3d2b1f]/40">Customer</label>
              <button className="flex items-center gap-1 text-xs font-medium text-[#c4900a] hover:underline">
                <UserPlus size={14} />
                New Customer
              </button>
            </div>
            <select 
              className="w-full rounded-lg border border-[#3d2b1f]/10 px-3 py-2 text-sm outline-none"
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Totals & Actions */}
          <div className="bg-[#fdfcf0]/50 p-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#3d2b1f]/60">Subtotal</span>
                <span className="font-medium">E{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3d2b1f]/60">VAT (15%)</span>
                <span className="font-medium">E{vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#7a2b22]/10 pt-2 text-lg font-bold text-[#7a2b22]">
                <span>Total</span>
                <span>E{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                disabled={cart.length === 0 || isCheckingOut}
                onClick={() => handleCheckout('quotation')}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-[#7a2b22]/20 py-3 text-[#7a2b22] transition-colors hover:bg-[#7a2b22]/5 disabled:opacity-50"
              >
                <Quote size={18} />
                <span className="text-[10px] font-bold uppercase">Quotation</span>
              </button>
              <button
                disabled={cart.length === 0 || isCheckingOut}
                onClick={() => handleCheckout('invoice')}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-[#7a2b22]/20 py-3 text-[#7a2b22] transition-colors hover:bg-[#7a2b22]/5 disabled:opacity-50"
              >
                <FileText size={18} />
                <span className="text-[10px] font-bold uppercase">Invoice</span>
              </button>
              <button
                disabled={cart.length === 0 || isCheckingOut}
                onClick={() => handleCheckout('receipt')}
                className="flex-[2] flex flex-col items-center gap-1 rounded-lg bg-[#7a2b22] py-3 text-white transition-colors hover:bg-[#5a1f19] disabled:opacity-50"
              >
                <Receipt size={18} />
                <span className="text-[10px] font-bold uppercase">Pay & Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
