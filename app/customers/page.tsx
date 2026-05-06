'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/Shell';
import { useCustomers, useProducts } from '@/lib/hooks';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  History, 
  X,
  Eye,
  Loader2,
  Trash2,
  Edit2
} from 'lucide-react';

export default function CustomersPage() {
  const { customers, loading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (customer: any = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const customerData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
        toast.success(`Customer "${customerData.name}" updated`);
      } else {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          createdAt: serverTimestamp(),
        });
        toast.success(`Customer "${customerData.name}" added`);
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      toast.success('Customer deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'customers');
    }
  };

  const handleViewHistory = (customer: any) => {
    setViewingCustomerHistory(customer);
    const q = query(collection(db, 'documents'), where('customerId', '==', customer.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomerOrders(docs);
    });
    return unsubscribe;
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#7a2b22]">Customer Database</h1>
            <p className="text-[#3d2b1f]/60">Track client orders, spending, and contact details.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-[#7a2b22] px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-[#5a1f19]"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </header>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d2b1f]/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-xl border border-[#3d2b1f]/10 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#7a2b22]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((c) => (
            <motion.div
              layout
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative overflow-hidden rounded-2xl border border-[#7a2b22]/10 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-full bg-[#fdfcf0] p-3 text-[#7a2b22]">
                  <User size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(c)}
                    className="rounded-lg p-2 text-[#3d2b1f]/30 hover:bg-[#7a2b22]/5 hover:text-[#7a2b22]"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleViewHistory(c)}
                    className="rounded-lg p-2 text-[#3d2b1f]/30 hover:bg-[#c4900a]/5 hover:text-[#c4900a]"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg p-2 text-[#3d2b1f]/30 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="mb-1 font-serif text-xl font-bold text-[#7a2b22]">{c.name}</h3>
              <div className="space-y-2 text-sm text-[#3d2b1f]/60">
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{c.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{c.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span className="line-clamp-1">{c.address || 'No address'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-[#3d2b1f]/40">
            <Users size={48} className="mb-2" />
            <p>No customers found. Add your first customer!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
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
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
                </h2>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={24} className="text-[#3d2b1f]/40" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                    placeholder="e.g. Thabo Mdluli"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                    placeholder="thabo@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                    placeholder="+268 7xxx xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3d2b1f]/60">Physical Address</label>
                  <textarea 
                    className="w-full rounded-lg border border-[#3d2b1f]/10 p-2.5 outline-none focus:border-[#7a2b22]/30"
                    placeholder="Residential address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <button 
                  disabled={isSaving}
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7a2b22] py-3 font-semibold text-white transition-all hover:bg-[#5a1f19] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : (editingCustomer ? 'Update Customer' : 'Add Customer')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <AnimatePresence>
        {viewingCustomerHistory && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomerHistory(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#7a2b22]/10 p-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#7a2b22]">{viewingCustomerHistory.name}</h2>
                  <p className="text-sm text-[#3d2b1f]/60">Customer Purchase History</p>
                </div>
                <button onClick={() => setViewingCustomerHistory(null)}>
                  <X size={24} className="text-[#3d2b1f]/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="mb-8 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#fdfcf0] p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3d2b1f]/40">Total Spent</p>
                    <p className="text-2xl font-bold text-[#7a2b22]">
                      E{customerOrders.reduce((sum, o) => sum + (o.type === 'receipt' ? o.totalAmount : 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#fdfcf0] p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3d2b1f]/40">Orders</p>
                    <p className="text-2xl font-bold text-[#7a2b22]">{customerOrders.length}</p>
                  </div>
                </div>

                <h3 className="mb-4 text-sm font-bold uppercase text-[#3d2b1f]/40">Recent Documents</h3>
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b border-[#fdfcf0] pb-4">
                      <div>
                        <p className="font-bold text-[#7a2b22]">{order.documentNumber}</p>
                        <p className="text-xs text-[#3d2b1f]/50">
                          {order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'} • {order.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#c4900a]">E{order.totalAmount.toFixed(2)}</p>
                        <p className="text-[10px] font-medium uppercase tracking-tighter text-[#3d2b1f]/40 leading-none">
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {customerOrders.length === 0 && (
                    <p className="text-center text-[#3d2b1f]/40">No purchase history found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
