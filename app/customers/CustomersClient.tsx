'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Edit, 
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { useCustomers, useSettings } from '@/lib/hooks';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { toast } from 'sonner';

export function CustomersClient() {
  const { customers, loading } = useCustomers();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    if (!newCustomer.name) {
      toast.error('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'customers'), {
        name: newCustomer.name,
        email: newCustomer.email || null,
        phone: newCustomer.phone || null,
        address: newCustomer.address || null,
        createdAt: serverTimestamp()
      });
      
      toast.success('Customer added successfully!');
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
    } catch (error) {
      console.error('Add customer error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'customers');
      toast.error('Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold" style={{ color: settings.brandColor }}>Client Directory</h1>
            <p className="text-[#3d2b1f]/60">Manage your loyal customers and their contact information.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: settings.brandColor, boxShadow: `0 10px 30px ${settings.brandColor}33` }}
          >
            <Plus size={18} />
            Add Customer
          </button>
        </header>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d2b1f]/20" size={20} />
          <input 
            type="text" 
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border bg-white p-4 pl-12 font-medium outline-none transition-all focus:ring-4 shadow-sm"
            style={{ borderColor: `${settings.brandColor}1A` }}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border bg-white p-6 h-48" style={{ borderColor: `${settings.brandColor}0D` }} />
            ))
          ) : filteredCustomers.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredCustomers.map((customer) => (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative rounded-3xl border bg-white p-6 shadow-xl transition-all hover:-translate-y-1"
                  style={{ borderColor: `${settings.brandColor}0D`, boxShadow: `0 10px 30px ${settings.brandColor}08` }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div 
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: `${settings.brandColor}0D`, color: settings.brandColor }}
                    >
                      <Users size={28} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button 
                        className="rounded-xl p-2.5 text-[#3d2b1f]/20 transition-all hover:bg-opacity-10"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = settings.brandColor;
                          e.currentTarget.style.backgroundColor = `${settings.brandColor}0D`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '';
                          e.currentTarget.style.backgroundColor = '';
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button className="rounded-xl p-2.5 text-[#3d2b1f]/20 hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black tracking-tight text-[#3d2b1f] group-hover:text-black transition-colors">{customer.name}</h3>
                  
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-sm font-bold text-[#3d2b1f]/50 transition-colors group-hover:text-[#3d2b1f]/80">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdfcf0]/50 shadow-sm border border-[#3d2b1f]/5">
                        <Mail size={14} />
                      </div>
                      <span className="truncate">{customer.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-[#3d2b1f]/50 transition-colors group-hover:text-[#3d2b1f]/80">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdfcf0]/50 shadow-sm border border-[#3d2b1f]/5">
                        <Phone size={14} />
                      </div>
                      <span>{customer.phone || 'No phone listed'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-[#3d2b1f]/50 transition-colors group-hover:text-[#3d2b1f]/80">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdfcf0]/50 shadow-sm border border-[#3d2b1f]/5">
                        <MapPin size={14} />
                      </div>
                      <span className="truncate">{customer.address || 'No address set'}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t pt-5" style={{ borderTopColor: `${settings.brandColor}0D` }}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: settings.brandColor }}>Client Since</span>
                      <span className="text-xs font-bold text-[#3d2b1f]/60">
                        {customer.createdAt ? new Date(customer.createdAt.toDate()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Recent'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1.5 rounded-full ring-1 ring-inset ring-green-600/10 shadow-sm">
                      <div className="h-1 w-1 rounded-full bg-green-600 animate-pulse" />
                      Active
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full py-20 text-center">
              <Users className="mx-auto mb-4 opacity-10" size={48} />
              <p className="text-lg font-bold text-[#3d2b1f]/40">No customers found</p>
            </div>
          )}
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
                  <h2 className="text-2xl font-black" style={{ color: settings.brandColor }}>Register Client</h2>
                  <p className="text-sm font-bold text-[#3d2b1f]/40 uppercase tracking-widest">Customer Relation</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full bg-[#fdfcf0] p-2 text-[#3d2b1f]/40 transition-colors hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Full Name *</label>
                  <input 
                    required
                    type="text" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="e.g., John Doe"
                    className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                    style={{ borderColor: `${settings.brandColor}1A` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Email Address</label>
                    <input 
                      type="email" 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="john@example.com"
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="+268 ..."
                      className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100"
                      style={{ borderColor: `${settings.brandColor}1A` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: settings.brandColor }}>Address</label>
                  <textarea 
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="e.g., Mbabane, Swaziland"
                    rows={2}
                    className="w-full rounded-2xl border bg-[#fdfcf0]/50 p-4 font-bold outline-none focus:border-opacity-100 resize-none"
                    style={{ borderColor: `${settings.brandColor}1A` }}
                  />
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: settings.brandColor, boxShadow: `0 10px 30px ${settings.brandColor}33` }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    {isSubmitting ? 'Registering...' : 'Register Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
