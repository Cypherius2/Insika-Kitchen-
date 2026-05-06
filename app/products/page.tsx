'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/Shell';
import { useProducts } from '@/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Loader2,
  ChefHat
} from 'lucide-react';

export default function ProductsPage() {
  const { products, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        image: product.image || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: '', stock: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Approx 800KB limit for base64 in Firestore (1MB doc limit)
        alert('Image is too large. Please select a smaller file (under 800KB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      image: formData.image || null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#7a2b22]">Product Inventory</h1>
            <p className="text-[#3d2b1f]/60">Manage your bakery items and stock levels.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-[#7a2b22] px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-[#5a1f19]"
          >
            <Plus size={20} />
            Add Product
          </button>
        </header>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or category..."
              className="w-full rounded-xl border border-[#3d2b1f]/10 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#7a2b22]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#7a2b22]/10 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#fdfcf0]/50 text-xs font-bold uppercase tracking-wider text-[#3d2b1f]/40">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7a2b22]/5">
              <AnimatePresence>
                {filteredProducts.map((p) => (
                  <motion.tr 
                    layout
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group transition-colors hover:bg-[#fdfcf0]/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[#fdfcf0] text-[#7a2b22] border border-[#7a2b22]/10">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <ChefHat size={24} />
                          )}
                        </div>
                        <span className="font-semibold text-[#3d2b1f]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-full bg-[#7a2b22]/5 px-3 py-1 text-xs font-medium text-[#7a2b22]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#c4900a]">E{p.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${p.stock < 10 ? 'text-red-500' : 'text-[#3d2b1f]'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="rounded-lg p-2 text-[#3d2b1f]/40 transition-colors hover:bg-[#7a2b22]/5 hover:text-[#7a2b22]"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-2 text-[#3d2b1f]/40 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredProducts.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-[#3d2b1f]/40">
              <Package size={48} className="mb-2" />
              <p>No products available. Add one to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#7a2b22]">
                  {editingProduct ? 'Edit Product' : 'New Product'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1 text-[#3d2b1f]/40 hover:bg-[#fdfcf0]"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Product Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                    placeholder="e.g. Chicken Samosa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Price (E)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Stock</label>
                    <input 
                      required
                      type="number" 
                      className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Category</label>
                  <input 
                    required
                    type="text" 
                    className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                    placeholder="e.g. Savory, Sweet..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Product Image</label>
                  <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-[#7a2b22]/10 bg-[#fdfcf0]/50 p-6 transition-all hover:border-[#7a2b22]/20">
                    {formData.image ? (
                      <div className="group relative h-32 w-32 overflow-hidden rounded-lg shadow-md">
                        <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X size={24} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[#3d2b1f]/40">
                        <Package size={40} />
                        <div className="text-center">
                          <p className="text-sm font-bold">Click to upload or drag and drop</p>
                          <p className="text-[10px]">JPEG or PNG (max 800KB)</p>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                </div>
                <button 
                  disabled={isSaving}
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7a2b22] py-3 font-semibold text-white transition-all hover:bg-[#5a1f19] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
