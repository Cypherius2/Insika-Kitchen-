'use client';

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Shell } from '@/components/Shell';
import { 
  Package, 
  Coffee,
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  MoreVertical, 
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Upload,
  Edit2,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePDF } from '@/lib/pdf-gen';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType, createNotification } from '@/lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';

export default function InventoryPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Hardware',
    description: '',
    variants: [] as any[]
  });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newVariant, setNewVariant] = useState({ sku: '', name: '', price: '', stock: '' });

  useEffect(() => {
    if (!profile) return;
    
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, [profile]);

  const addVariantToForm = () => {
    if (!newVariant.sku || !newVariant.name || !newVariant.price || !newVariant.stock) return;
    setFormData({
      ...formData,
      variants: [...formData.variants, {
        ...newVariant,
        price: parseFloat(newVariant.price),
        stock: parseInt(newVariant.stock)
      }]
    });
    setNewVariant({ sku: '', name: '', price: '', stock: '' });
  };

  const removeVariantFromForm = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await createNotification(
        'Product Matrix Synced',
        `SKU ${formData.name} has been successfully integrated into the catalog.`,
        'SUCCESS'
      );
      setIsModalOpen(false);
      setFormData({ name: '', price: '', stock: '', category: 'Hardware', description: '', variants: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const batch = results.data;
        let successCount = 0;
        let failCount = 0;

        for (const item of batch as any[]) {
          try {
            // Basic validation
            if (!item.name || !item.price || !item.stock) {
              failCount++;
              continue;
            }

            await addDoc(collection(db, 'products'), {
              name: item.name,
              price: parseFloat(item.price) || 0,
              stock: parseInt(item.stock) || 0,
              category: item.category || 'Hardware',
              description: item.description || '',
              variants: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            successCount++;
          } catch (error) {
            console.error("Failed to import individual node:", error);
            failCount++;
          }
        }

        alert(`Matrix Update Complete: ${successCount} successful integrations, ${failCount} failures.`);
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        console.error("CSV Parse Failure:", error);
        alert("Failed to decrypt CSV matrix.");
        setIsImporting(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      if (product) {
        await createNotification(
          'Product Purged',
          `SKU ${product.name} has been removed from the active grid.`,
          'WARNING'
        );
      }
      setActiveMenuId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleDuplicate = async (product: any) => {
    try {
      const { id, createdAt, updatedAt, ...rest } = product;
      await addDoc(collection(db, 'products'), {
        ...rest,
        name: `${rest.name} (Clone)`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await createNotification(
        'SKU Duplicated',
        `Entity signatures for ${product.name} have been cloned.`,
        'SUCCESS'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || '',
      variants: product.variants || []
    });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        updatedAt: serverTimestamp()
      });
      await createNotification(
        'SKU Recalibrated',
        `Biological and technical specs for ${formData.name} were updated.`,
        'INFO'
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', category: 'Hardware', description: '', variants: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${editingProduct.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuotation = async (item: any) => {
    const docId = `QUO-${Math.floor(1000 + Math.random() * 9000)}`;
    const date = new Date().toISOString().split('T')[0];
    const customerName = 'Prospect Entity';
    const total = item.price * 1.15;

    try {
      await addDoc(collection(db, 'transactions'), {
        docId,
        type: 'QUOTATION',
        customerName,
        total,
        status: 'PENDING',
        date,
        items: [{ name: item.name, quantity: 1, price: item.price }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to sync quotation ledger:", error);
    }

    generatePDF({
      type: 'QUOTATION',
      number: docId,
      date,
      customerName,
      customerEmail: 'prospect@business.io',
      items: [{ name: item.name, quantity: 1, price: item.price }],
      subtotal: item.price,
      tax: item.price * 0.15,
      total,
      businessName: profile?.businessName || 'MiraTech Industries'
    });

    await createNotification(
      'Quotation Generated',
      `Financial projection ${docId} created for ${item.name}.`,
      'INFO'
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="p-10 space-y-10 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#00a2ff]">
                 <Package size={16} />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Master Catalog Matrix</p>
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Inventory Control</h2>
           </div>
           
           <div className="flex items-center gap-4">
              {profile?.role === 'admin' && (
                <>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBulkImport}
                    accept=".csv"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 text-gray-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                  >
                     {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                     Bulk Import
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                  >
                     <Plus size={16} />
                     Initialize SKU
                  </button>
                </>
              )}
           </div>
        </header>

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
           <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row gap-6 justify-between items-center bg-[#fafafa]/50">
              <div className="relative group w-full sm:max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a2ff] transition-colors" size={18} />
                 <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter Logic..." 
                  className="w-full pl-12 pr-6 py-4 bg-white border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all shadow-sm" 
                 />
              </div>
              <button className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all">
                 <Filter size={16} />
                 Advanced Logic
              </button>
           </div>

           <div className="flex-1 overflow-x-auto overflow-y-visible">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-20 gap-4 opacity-30">
                  <Loader2 className="animate-spin text-[#00a2ff]" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing State...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-20 gap-6 opacity-30 text-center">
                   <div className="h-24 w-24 rounded-[3rem] border-4 border-dashed border-gray-200 flex items-center justify-center">
                      <Package size={32} className="text-gray-400" />
                   </div>
                   <div>
                      <p className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">No Active Nodes</p>
                      <p className="text-xs font-medium text-gray-500">Initialize a new SKU to begin matrix population</p>
                   </div>
                </div>
              ) : (
                <table className="w-full">
                   <thead>
                      <tr className="border-b border-gray-50">
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Object Type</th>
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stock Status</th>
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Base Value</th>
                         <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map((product) => (
                         <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-5">
                                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00a2ff] overflow-hidden group-hover:scale-110 transition-all">
                                     <Package size={24} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-gray-900 tracking-tight leading-none mb-1">{product.name}</p>
                                     <div className="flex flex-wrap gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{product.category}</p>
                                        {product.variants?.length > 0 && (
                                           <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#00a2ff]/5 text-[#00a2ff] rounded border border-[#00a2ff]/10">
                                              {product.variants.length} Variants
                                           </span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-3">
                                  <span className={cn(
                                     "h-2 w-2 rounded-full",
                                     product.stock < 10 ? "bg-red-500 animate-pulse" : "bg-green-500 shadow-[0_0_8px_#22c55e]"
                                  )}></span>
                                  <span className="text-xs font-bold text-gray-600">
                                    {product.stock < 10 ? 'Low Capacity' : 'Stabilized'} ({product.stock})
                                  </span>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                               <p className="text-sm font-black text-gray-900">${product.price.toFixed(2)}</p>
                            </td>
                            <td className="px-10 py-6 text-right relative overflow-visible">
                               <div className="flex items-center justify-end gap-1">
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all mr-2 translate-x-4 group-hover:translate-x-0 duration-300 pointer-events-none group-hover:pointer-events-auto">
                                     {profile?.role === 'admin' && (
                                       <>
                                         <button 
                                            onClick={() => openEditModal(product)}
                                            className="h-10 w-10 text-gray-400 hover:text-[#00a2ff] hover:bg-[#00a2ff]/5 rounded-xl transition-all inline-flex items-center justify-center group/btn"
                                            title="Quick Edit SKU"
                                         >
                                            <Edit2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                         </button>
                                         <button 
                                            onClick={() => handleDuplicate(product)}
                                            className="h-10 w-10 text-gray-400 hover:text-[#00a2ff] hover:bg-[#00a2ff]/5 rounded-xl transition-all inline-flex items-center justify-center group/btn"
                                            title="Duplicate Logic"
                                         >
                                            <Copy size={16} className="group-hover/btn:scale-110 transition-transform" />
                                         </button>
                                       </>
                                     )}
                                     <button 
                                        onClick={() => handleCreateQuotation(product)}
                                        className="h-10 w-10 text-gray-400 hover:text-[#00a2ff] hover:bg-[#00a2ff]/5 rounded-xl transition-all inline-flex items-center justify-center group/btn"
                                        title="Generate Quote PDF"
                                     >
                                        <FileText size={16} className="group-hover/btn:scale-110 transition-transform" />
                                     </button>
                                     <div className="w-[1px] h-6 bg-gray-100 mx-1"></div>
                                  </div>

                                  <button 
                                     onClick={() => setActiveMenuId(activeMenuId === product.id ? null : product.id)}
                                     className="h-10 w-10 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all inline-flex items-center justify-center relative z-10"
                                  >
                                     <MoreVertical size={18} />
                                  </button>

                                  <AnimatePresence>
                                    {activeMenuId === product.id && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={() => setActiveMenuId(null)} 
                                        />
                                        <motion.div 
                                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                          className="absolute right-10 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-left"
                                        >
                                          {profile?.role === 'admin' ? (
                                            <>
                                              <button 
                                                onClick={() => openEditModal(product)}
                                                className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                              >
                                                <Edit2 size={14} className="text-[#00a2ff]" />
                                                Edit SKU
                                              </button>
                                              <button 
                                                onClick={() => handleDelete(product.id)}
                                                className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-50"
                                              >
                                                <Trash2 size={14} />
                                                Delete SKU
                                              </button>
                                            </>
                                          ) : (
                                            <button 
                                              onClick={() => handleCreateQuotation(product)}
                                              className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                            >
                                              <FileText size={14} className="text-[#00a2ff]" />
                                              Generate Quotation
                                            </button>
                                          )}
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {(isModalOpen || isEditModalOpen) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  setFormData({ name: '', price: '', stock: '', category: 'Hardware', description: '', variants: [] });
                }}
                className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden shadow-black/40 flex flex-col max-h-[90vh]"
              >
                <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-[#fafafa]/50 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#0a0a0a] text-[#00a2ff] flex items-center justify-center shadow-lg">
                      {isEditModalOpen ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">
                        {isEditModalOpen ? 'Edit Product' : 'New Product'}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {isEditModalOpen ? 'Update matrix SKU details' : 'Initialize a new inventory SKU'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditModalOpen(false);
                      setEditingProduct(null);
                      setFormData({ name: '', price: '', stock: '', category: 'Hardware', description: '', variants: [] });
                    }}
                    className="h-12 w-12 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={isEditModalOpen ? handleUpdateProduct : handleAddProduct} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2 sm:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Product Name</label>
                       <input 
                         required
                         type="text" 
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         placeholder="e.g. Wireless Mouse G-700"
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Unit Price ($)</label>
                       <input 
                         required
                         type="number" 
                         step="0.01"
                         value={formData.price}
                         onChange={(e) => setFormData({...formData, price: e.target.value})}
                         placeholder="0.00"
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Current Stock</label>
                       <input 
                         required
                         type="number" 
                         value={formData.stock}
                         onChange={(e) => setFormData({...formData, stock: e.target.value})}
                         placeholder="0"
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                       <select 
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       >
                         <option>Hardware</option>
                         <option>Software</option>
                         <option>Accessories</option>
                         <option>Core Logic</option>
                         <option>Power Module</option>
                       </select>
                    </div>

                    <div className="sm:col-span-2 space-y-4 pt-4">
                       <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Variant Extensions</label>
                       </div>
                       
                       <div className="space-y-3">
                          {formData.variants.map((v, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-[#00a2ff]/5 rounded-2xl border border-[#00a2ff]/10">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                   <div>
                                      <p className="text-[8px] font-black uppercase text-gray-400">SKU</p>
                                      <p className="text-xs font-bold text-gray-900">{v.sku}</p>
                                   </div>
                                   <div>
                                      <p className="text-[8px] font-black uppercase text-gray-400">Name</p>
                                      <p className="text-xs font-bold text-gray-900">{v.name}</p>
                                   </div>
                                   <div>
                                      <p className="text-[8px] font-black uppercase text-gray-400">Price</p>
                                      <p className="text-xs font-bold text-gray-900">${v.price}</p>
                                   </div>
                                   <div>
                                      <p className="text-[8px] font-black uppercase text-gray-400">Stock</p>
                                      <p className="text-xs font-bold text-gray-900">{v.stock}</p>
                                   </div>
                                </div>
                                <button 
                                   type="button"
                                   onClick={() => removeVariantFromForm(i)}
                                   className="h-8 w-8 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors ml-4"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          ))}

                          <div className="p-4 md:p-6 border-2 border-dashed border-gray-100 rounded-3xl space-y-4 bg-gray-50/30">
                             <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                <input 
                                   type="text" 
                                   placeholder="SKU-001" 
                                   value={newVariant.sku}
                                   onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                                   className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all shadow-sm outline-none"
                                />
                                <input 
                                   type="text" 
                                   placeholder="Variant Name" 
                                   value={newVariant.name}
                                   onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                                   className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all shadow-sm outline-none"
                                />
                                <input 
                                   type="number" 
                                   placeholder="Price" 
                                   value={newVariant.price}
                                   onChange={(e) => setNewVariant({...newVariant, price: e.target.value})}
                                   className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all shadow-sm outline-none"
                                />
                                <input 
                                   type="number" 
                                   placeholder="Stock" 
                                   value={newVariant.stock}
                                   onChange={(e) => setNewVariant({...newVariant, stock: e.target.value})}
                                   className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all shadow-sm outline-none"
                                />
                             </div>
                             <button 
                                type="button"
                                onClick={addVariantToForm}
                                className="w-full py-3 bg-white border border-[#00a2ff]/20 text-[#00a2ff] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00a2ff]/5 transition-all flex items-center justify-center gap-2 shadow-sm"
                             >
                                <Plus size={14} />
                                Add Variant Node
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full py-5 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3",
                        isEditModalOpen ? "bg-[#00a2ff] hover:bg-[#0091e6]" : "bg-[#0a0a0a] hover:bg-black"
                      )}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isEditModalOpen ? <Edit2 size={16} /> : <Plus size={16} />)}
                      {isEditModalOpen ? 'Commit Matrix Update' : 'Add Product to Catalog'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}
