'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Download, 
  Package, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  X,
  Loader2,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useProducts, useSettings } from '@/lib/hooks';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

export function ProductsClient() {
  const { products, loading } = useProducts();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'category' | 'price' | 'stock' | 'delete' | null>(null);
  const [bulkValue, setBulkValue] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    image: ''
  });

  const categories = ['All', 'Low Stock', ...Array.from(new Set(products.map(p => p.category)))];

  const lowStockThreshold = settings?.lowStockThreshold || 10;

  useEffect(() => {
    const lowStockItems = products.filter(p => p.stock <= lowStockThreshold);
    if (lowStockItems.length > 0 && !loading) {
      toast(`${lowStockItems.length} products are currently low on stock!`, {
        icon: '⚠️',
        description: 'Check your inventory to ensure availability.',
        duration: 5000,
      });
    }
  }, [products.length, loading, lowStockThreshold]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    if (selectedCategory === 'Low Stock') {
      matchesCategory = product.stock <= lowStockThreshold;
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        image: newProduct.image || null,
        createdAt: serverTimestamp()
      });
      
      toast.success('Product added successfully!');
      setIsAddModalOpen(false);
      setNewProduct({ name: '', category: '', price: '', stock: '', image: '' });
    } catch (error) {
      console.error('Add product error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProductClick = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingProduct) return;

    if (!editingProduct.name || !editingProduct.category || !editingProduct.price || !editingProduct.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock),
        image: editingProduct.image || null,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Product updated successfully!');
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Update product error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!db) return;
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'products', id));
      await batch.commit();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error('Failed to delete product');
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkAction = async () => {
    if (!db) return;
    if (selectedProductIds.length === 0) return;
    if (!bulkActionType) return;

    if (bulkActionType !== 'delete' && !bulkValue) {
      toast.error('Please provide a value for the bulk update');
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      selectedProductIds.forEach(id => {
        const productRef = doc(db, 'products', id);
        if (bulkActionType === 'delete') {
          batch.delete(productRef);
        } else {
          const updateData: any = {
            updatedAt: serverTimestamp()
          };
          if (bulkActionType === 'category') updateData.category = bulkValue;
          if (bulkActionType === 'price') updateData.price = parseFloat(bulkValue);
          if (bulkActionType === 'stock') updateData.stock = parseInt(bulkValue);
          batch.update(productRef, updateData);
        }
      });

      await batch.commit();
      toast.success(`Bulk ${bulkActionType} completed successfully for ${selectedProductIds.length} products`);
      setSelectedProductIds([]);
      setIsBulkModalOpen(false);
      setBulkActionType(null);
      setBulkValue('');
    } catch (error) {
      console.error('Bulk action error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
      toast.error(`Failed to perform bulk ${bulkActionType}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    const headers = ['Product Name', 'Category', 'Price (E)', 'Stock Level'];
    const rows = filteredProducts.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.price.toFixed(2),
      p.stock
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Product list exported as CSV');
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold" style={{ color: settings.brandColor }}>Product Inventory</h1>
            <p className="text-[#3d2b1f]/60">Manage your menu items, ingredients, and stock levels.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-xl border bg-white px-5 py-3 text-sm font-bold shadow-sm transition-all hover:bg-opacity-80 active:scale-95"
              style={{ color: settings.brandColor, borderColor: `${settings.brandColor}1A` }}
            >
              <FileSpreadsheet size={18} />
              Export CSV
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: settings.brandColor, boxShadow: `0 10px 30px ${settings.brandColor}33` }}
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border bg-white p-4 pl-12 font-medium outline-none transition-all focus:ring-4 shadow-sm"
              style={{ borderColor: `${settings.brandColor}1A` }}
            />
          </div>
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={18} />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-2xl border bg-white p-4 pl-12 pr-10 font-medium outline-none transition-all focus:ring-4 shadow-sm"
                style={{ borderColor: `${settings.brandColor}1A` }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={18} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedProductIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div 
                className="flex flex-col items-center justify-between gap-4 rounded-2xl p-4 sm:flex-row shadow-lg border"
                style={{ backgroundColor: `${settings.brandColor}0D`, borderColor: `${settings.brandColor}33` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black shadow-sm" style={{ color: settings.brandColor }}>
                    {selectedProductIds.length}
                  </div>
                  <div>
                    <p className="font-bold text-[#3d2b1f]" style={{ color: settings.brandColor }}>Products Selected</p>
                    <button 
                      onClick={() => setSelectedProductIds([])}
                      className="text-xs font-bold hover:underline opacity-60"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => { setBulkActionType('category'); setIsBulkModalOpen(true); }}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest border transition-all hover:bg-[#3d2b1f]/5"
                    style={{ borderColor: `${settings.brandColor}1A`, color: settings.brandColor }}
                  >
                    Set Category
                  </button>
                  <button 
                    onClick={() => { setBulkActionType('price'); setIsBulkModalOpen(true); }}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest border transition-all hover:bg-[#3d2b1f]/5"
                    style={{ borderColor: `${settings.brandColor}1A`, color: settings.brandColor }}
                  >
                    Set Price
                  </button>
                  <button 
                    onClick={() => { setBulkActionType('stock'); setIsBulkModalOpen(true); }}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest border transition-all hover:bg-[#3d2b1f]/5"
                    style={{ borderColor: `${settings.brandColor}1A`, color: settings.brandColor }}
                  >
                    Set Stock
                  </button>
                  <button 
                    onClick={() => { setBulkActionType('delete'); setIsBulkModalOpen(true); }}
                    className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600 border border-red-100 transition-all hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-x-auto rounded-3xl border bg-white shadow-xl shadow-[#7a2b22]/5"
          style={{ borderColor: `${settings.brandColor}1A` }}
        >
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-[#fdfcf0]/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-8" style={{ color: `${settings.brandColor}66` }}>
                <tr>
                  <th className="px-6 py-5 w-10">
                    <button 
                      onClick={toggleAllSelection}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0
                          ? "bg-[#7a2b22] border-[#7a2b22] text-white"
                          : "bg-white border-gray-300"
                      )}
                      style={{ 
                        backgroundColor: selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? settings.brandColor : undefined,
                        borderColor: selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? settings.brandColor : undefined
                      }}
                    >
                      {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 && <CheckCircle2 size={14} />}
                    </button>
                  </th>
                  <th className="px-4 py-5">Product Info</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5 text-right">Price</th>
                  <th className="px-6 py-5 text-center">Stock</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: `${settings.brandColor}0D` }}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gray-100" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-100" />
                            <div className="h-3 w-20 rounded bg-gray-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6"><div className="h-6 w-20 rounded-full bg-gray-100" /></td>
                      <td className="px-6 py-6"><div className="ml-auto h-4 w-16 rounded bg-gray-100" /></td>
                      <td className="px-6 py-6"><div className="mx-auto h-6 w-12 rounded-full bg-gray-100" /></td>
                      <td className="px-8 py-6"></td>
                    </tr>
                  ))
                ) : filteredProducts.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                        <motion.tr 
                          key={product.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "group transition-colors hover:bg-[#fdfcf0]/30",
                            selectedProductIds.includes(product.id) && "bg-[#fdfcf0]/80"
                          )}
                        >
                          <td className="px-6 py-6">
                            <button 
                              onClick={() => toggleProductSelection(product.id)}
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border transition-all",
                                selectedProductIds.includes(product.id)
                                  ? "bg-[#7a2b22] border-[#7a2b22] text-white scale-110 shadow-sm"
                                  : "bg-white border-gray-300 group-hover:border-[#7a2b22]/50"
                              )}
                              style={{ 
                                backgroundColor: selectedProductIds.includes(product.id) ? settings.brandColor : undefined,
                                borderColor: selectedProductIds.includes(product.id) ? settings.brandColor : undefined
                              }}
                            >
                              {selectedProductIds.includes(product.id) && <CheckCircle2 size={14} />}
                            </button>
                          </td>
                          <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 shadow-inner">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                              ) : (
                                <Package style={{ color: `${settings.brandColor}33` }} size={24} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#3d2b1f]">{product.name}</p>
                              <p className="text-xs font-bold text-[#3d2b1f]/30 uppercase tracking-widest">{product.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span 
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest"
                            style={{ backgroundColor: `${settings.brandColor}0D`, color: settings.brandColor }}
                          >
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span className="font-black text-[#3d2b1f]/80">E{product.price.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={cn(
                            "inline-flex h-8 w-12 items-center justify-center rounded-lg text-xs font-black",
                            product.stock <= lowStockThreshold 
                              ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
                              : "bg-green-50 text-green-600 border border-green-100"
                          )}>
                            {product.stock}
                          </div>
                          {product.stock <= lowStockThreshold && (
                            <p className="mt-1 text-[10px] font-black uppercase text-red-500">Low Stock</p>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button 
                              onClick={() => handleEditProductClick(product)}
                              className="rounded-lg p-2 text-[#3d2b1f]/40 transition-all hover:bg-gray-100 hover:text-black"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="rounded-lg p-2 text-[#3d2b1f]/40 hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Package className="mx-auto mb-4 opacity-10" size={48} />
                      <p className="text-lg font-bold text-[#3d2b1f]/40">No products found</p>
                      <button 
                        onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                        className="mt-2 text-sm font-bold hover:underline"
                        style={{ color: settings.brandColor }}
                      >
                        Clear search filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black" style={{ color: settings.brandColor }}>Add New Product</h2>
                  <p className="text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-widest">Inventory Management</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full bg-[#fdfcf0] p-2 text-[#3d2b1f]/40 transition-colors hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Product Name *</label>
                  <input 
                    required
                    type="text" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g., King Burger"
                    className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                    style={{ borderColor: `${settings.brandColor}1A` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Category *</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      placeholder="e.g., Burgers"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Price (E) *</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Initial Stock *</label>
                    <input 
                      required
                      type="number" 
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      placeholder="0"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Image URL</label>
                    <input 
                      type="url" 
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                      placeholder="https://..."
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: settings.brandColor, boxShadow: `0 10px 30px ${settings.brandColor}33` }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    {isSubmitting ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black" style={{ color: settings.brandColor }}>Edit Product</h2>
                  <p className="text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-widest">Inventory Management</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full bg-[#fdfcf0] p-2 text-[#3d2b1f]/40 transition-colors hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Product Name *</label>
                  <input 
                    required
                    type="text" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    placeholder="e.g., King Burger"
                    className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                    style={{ borderColor: `${settings.brandColor}1A` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Category *</label>
                    <input 
                      required
                      type="text" 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      placeholder="e.g., Burgers"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Price (E) *</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Stock Level *</label>
                    <input 
                      required
                      type="number" 
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                      placeholder="0"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Image URL</label>
                    <input 
                      type="url" 
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                      placeholder="https://..."
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: settings.brandColor, boxShadow: `0 10px 30px ${settings.brandColor}33` }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {isSubmitting ? 'Updating...' : 'Update Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isBulkModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black" style={{ color: settings.brandColor }}>
                    {bulkActionType === 'delete' ? 'Confirm Deletion' : `Update ${bulkActionType}`}
                  </h2>
                  <p className="text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-widest">
                    Bulk Action • {selectedProductIds.length} Products
                  </p>
                </div>
                <button 
                  onClick={() => setIsBulkModalOpen(false)}
                  className="rounded-full bg-[#fdfcf0] p-2 text-[#3d2b1f]/40 transition-colors hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {bulkActionType === 'delete' ? (
                  <div className="flex items-start gap-4 rounded-2xl bg-red-50 p-4 text-red-700">
                    <AlertCircle className="mt-0.5 shrink-0" size={20} />
                    <div className="text-sm font-bold">
                      Are you sure you want to delete {selectedProductIds.length} selected products? This action cannot be undone.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>
                      New {bulkActionType === 'category' ? 'Category' : bulkActionType === 'price' ? 'Price (E)' : 'Stock Level'}
                    </label>
                    <input 
                      autoFocus
                      type={bulkActionType === 'category' ? 'text' : 'number'}
                      step={bulkActionType === 'price' ? '0.01' : '1'}
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      placeholder={bulkActionType === 'category' ? 'e.g., Beverages' : '0.00'}
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsBulkModalOpen(false)}
                    className="flex-1 rounded-2xl border bg-white py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-95"
                    style={{ borderColor: `${settings.brandColor}1A`, color: settings.brandColor }}
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isSubmitting || (bulkActionType !== 'delete' && !bulkValue)}
                    onClick={handleBulkAction}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{ 
                      backgroundColor: bulkActionType === 'delete' ? '#ef4444' : settings.brandColor, 
                      boxShadow: bulkActionType === 'delete' ? '0 10px 30px #ef444433' : `0 10px 30px ${settings.brandColor}33` 
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : bulkActionType === 'delete' ? (
                      <Trash2 size={20} />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    {isSubmitting ? 'Processing...' : bulkActionType === 'delete' ? 'Delete Products' : 'Apply Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </Shell>
  );
}
