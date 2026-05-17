'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  SearchCheck,
  X,
  Loader2,
  Trash2,
  Edit2,
  Mail as MailIcon,
  Link2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

export default function CustomersPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sector: 'Technology'
  });

  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });
    return () => unsubscribe();
  }, [profile]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'customers'), {
        ...formData,
        interfaceLinked: false,
        createdAt: serverTimestamp()
      });
      await createNotification(
        'New Entity Registered',
        `Client profile for ${formData.name} has been synthesized into the matrix.`,
        'SUCCESS'
      );
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', sector: 'Technology' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!confirm('Discard this entity profile?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      if (customer) {
        await createNotification(
          'Entity Discarded',
          `Subject ${customer.name} has been purged from the active directory.`,
          'WARNING'
        );
      }
      setActiveMenuId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  };

  const openEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      sector: customer.sector
    });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'customers', editingCustomer.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      await createNotification(
        'Entity Profile Updated',
        `Biological signatures for ${formData.name} have been recalibrated.`,
        'INFO'
      );
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', sector: 'Technology' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${editingCustomer.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkInterface = async (customer: any) => {
    if (customer.interfaceLinked) return;
    setLinkingId(customer.id);
    try {
      // Handshake protocol simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateDoc(doc(db, 'customers', customer.id), {
        interfaceLinked: true,
        linkedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customer.id}`);
    } finally {
      setLinkingId(null);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="p-10 space-y-10 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#00a2ff]">
                 <SearchCheck size={16} />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Matrix Directory</p>
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Client Directory</h2>
           </div>
           
           <div className="flex items-center gap-4">
              {profile?.role === 'admin' && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                >
                   <UserPlus size={16} />
                   Protocol New Entity
                </button>
              )}
           </div>
        </header>

        <div className="space-y-8">
           <div className="relative group max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a2ff] transition-colors" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Subjects..." 
                className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-3xl text-sm font-medium focus:ring-8 focus:ring-[#00a2ff]/5 focus:border-[#00a2ff] transition-all shadow-sm" 
              />
           </div>

           {loading ? (
             <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-30 text-center">
                <Loader2 className="animate-spin text-[#00a2ff]" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Retrieving Biological Signatures...</p>
             </div>
           ) : filteredCustomers.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-30 text-center">
                <div className="h-24 w-24 rounded-[3rem] border-4 border-dashed border-gray-200 flex items-center justify-center">
                   <UserPlus size={32} className="text-gray-400" />
                </div>
                <div>
                   <p className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">Directory Empty</p>
                   <p className="text-xs font-medium text-gray-500">No entities detected in the current matrix</p>
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCustomers.map((customer, i) => (
                   <div key={customer.id} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 group relative overflow-visible">
                      <div className="absolute top-8 right-8 z-10">
                        {profile?.role === 'admin' && (
                          <>
                            <button 
                              onClick={() => setActiveMenuId(activeMenuId === customer.id ? null : customer.id)}
                              className="h-10 w-10 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center bg-white/80 backdrop-blur-sm"
                            >
                               <MoreVertical size={18} />
                            </button>
                            
                            <AnimatePresence>
                              {activeMenuId === customer.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setActiveMenuId(null)} 
                                  />
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                                  >
                                    <button 
                                      onClick={() => openEditModal(customer)}
                                      className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                      <Edit2 size={14} className="text-[#00a2ff]" />
                                      Modify Matrix
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(customer.id)}
                                      className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-50"
                                    >
                                      <Trash2 size={14} />
                                      Delete Entity
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col items-center text-center mb-8 pt-4">
                         <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 p-[2px] shadow-inner group-hover:rotate-6 transition-transform duration-500 mb-6">
                            <div className="h-full w-full rounded-[2.4rem] bg-white p-1">
                               <img 
                                 src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${customer.id}`} 
                                 alt="Entity" 
                                 className="h-full w-full object-cover rounded-[2.3rem] grayscale group-hover:grayscale-0 transition-all duration-500" 
                               />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{customer.name}</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00a2ff] px-4 py-1.5 bg-[#00a2ff]/5 inline-block rounded-full border border-[#00a2ff]/10">
                               {customer.sector}
                            </p>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-4 text-gray-400 hover:text-gray-900 transition-colors group/link cursor-pointer pl-2">
                            <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover/link:bg-[#00a2ff] group-hover/link:text-white transition-all">
                               <MailIcon size={14} />
                            </div>
                            <span className="text-sm font-bold truncate">{customer.email}</span>
                         </div>
                         <div className="flex items-center gap-4 text-gray-400 hover:text-gray-900 transition-colors group/link cursor-pointer pl-2">
                            <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover/link:bg-[#00a2ff] group-hover/link:text-white transition-all">
                               <Phone size={14} />
                            </div>
                            <span className="text-sm font-bold">{customer.phone}</span>
                         </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                         <div className="text-left font-black tracking-tighter">
                            <p className="text-[10px] uppercase text-gray-300 tracking-widest leading-none mb-1">Status Origin</p>
                            <p className="text-sm text-gray-900 uppercase">
                               {customer.interfaceLinked ? 'Active Sync' : 'Verified Linked'}
                            </p>
                         </div>
                         <button 
                           onClick={() => handleLinkInterface(customer)}
                           disabled={linkingId === customer.id}
                           className={cn(
                             "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2",
                             customer.interfaceLinked 
                               ? "bg-green-500 text-white cursor-default shadow-green-200" 
                               : "bg-gray-900 text-white hover:bg-[#00a2ff] hover:shadow-[#00a2ff]/20"
                           )}
                         >
                            {linkingId === customer.id ? (
                               <Loader2 size={12} className="animate-spin" />
                            ) : customer.interfaceLinked ? (
                               <Check size={12} />
                            ) : (
                               <Link2 size={12} />
                            )}
                            {customer.interfaceLinked ? 'Interface Active' : 'Link Interface'}
                         </button>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>

        {/* Add/Edit Customer Modal */}
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
                  setEditingCustomer(null);
                  setFormData({ name: '', email: '', phone: '', sector: 'Technology' });
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
                      {isEditModalOpen ? <Edit2 size={20} /> : <UserPlus size={20} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">
                        {isEditModalOpen ? 'Modify Profile' : 'New Customer'}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {isEditModalOpen ? 'Update matrix entity records' : 'Register a new client entity'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditModalOpen(false);
                      setEditingCustomer(null);
                      setFormData({ name: '', email: '', phone: '', sector: 'Technology' });
                    }}
                    className="h-12 w-12 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={isEditModalOpen ? handleUpdateCustomer : handleAddCustomer} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2 sm:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                       <input 
                         required
                         type="text" 
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         placeholder="e.g. John Doe"
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                       <input 
                         required
                         type="email" 
                         value={formData.email}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                         placeholder="john.doe@example.com"
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                       <input 
                         type="tel" 
                         value={formData.phone}
                         onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         placeholder="+1 (555) 000-0000"
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Business Sector</label>
                       <select 
                         value={formData.sector}
                         onChange={(e) => setFormData({...formData, sector: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#00a2ff]/10 transition-all outline-none"
                       >
                         <option>Technology</option>
                         <option>Finance</option>
                         <option>Retail</option>
                         <option>Manufacturing</option>
                         <option>Services</option>
                       </select>
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
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (isEditModalOpen ? <Edit2 size={16} /> : <UserPlus size={16} />)}
                      {isEditModalOpen ? 'Commit Matrix Update' : 'Create Customer Profile'}
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
