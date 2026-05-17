'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { 
  Bell, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Check,
  Loader2,
  BellOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  read: boolean;
  createdAt: Timestamp;
}

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setActiveMenuId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const markFilteredAsRead = async () => {
    const targets = activeTab === 'ALL' ? notifications.filter(n => !n.read) : notifications.filter(n => !n.read);
    for (const n of targets) {
      await markAsRead(n.id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    return true;
  });

  return (
    <Shell>
      <div className="p-10 space-y-10 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#00a2ff]">
                 <Bell size={16} />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">System Telemetry Log</p>
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Activity Log</h2>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={markFilteredAsRead}
                className="px-6 py-4 bg-white border border-gray-100 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2"
              >
                 <Check size={14} />
                 Mark Read
              </button>
           </div>
        </header>

        <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-50">
             <button 
               onClick={() => setActiveTab('ALL')}
               className={cn(
                 "flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative",
                 activeTab === 'ALL' ? "text-gray-900" : "text-gray-300 hover:text-gray-500"
               )}
             >
               All Events
               {activeTab === 'ALL' && <motion.div layoutId="tab" className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-[#00a2ff] rounded-full" />}
             </button>
             <button 
               onClick={() => setActiveTab('UNREAD')}
               className={cn(
                 "flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative",
                 activeTab === 'UNREAD' ? "text-gray-900" : "text-gray-300 hover:text-gray-500"
               )}
             >
               Unread Alerts
               {notifications.filter(n => !n.read).length > 0 && (
                 <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-md text-[8px]">
                    {notifications.filter(n => !n.read).length}
                 </span>
               )}
               {activeTab === 'UNREAD' && <motion.div layoutId="tab" className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-[#00a2ff] rounded-full" />}
             </button>
          </div>

          <div className="divide-y divide-gray-50 min-h-[400px]">
             {loading ? (
               <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-30 text-center">
                  <Loader2 className="animate-spin text-[#00a2ff]" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Central Data Hub...</p>
               </div>
             ) : filteredNotifications.length === 0 ? (
               <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-30 text-center">
                  <BellOff size={48} className="text-gray-200" />
                  <div>
                     <p className="text-sm font-black uppercase tracking-widest text-gray-900">Log Clear</p>
                     <p className="text-xs font-medium text-gray-500">No active events recorded in this sector</p>
                  </div>
               </div>
             ) : (
               filteredNotifications.map((n) => (
                 <div 
                   key={n.id} 
                   className={cn(
                     "p-8 transition-all relative group",
                     !n.read ? "bg-blue-50/20" : "bg-white hover:bg-gray-50/50"
                   )}
                 >
                   <div className="flex gap-8 items-start">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner",
                        n.type === 'CRITICAL' ? "bg-red-50 text-red-500" :
                        n.type === 'WARNING' ? "bg-orange-50 text-orange-500" :
                        n.type === 'SUCCESS' ? "bg-green-50 text-green-500" :
                        "bg-blue-50 text-[#00a2ff]"
                      )}>
                        {n.type === 'CRITICAL' ? <AlertTriangle size={24} /> : 
                         n.type === 'WARNING' ? <Info size={24} /> :
                         n.type === 'SUCCESS' ? <CheckCircle2 size={24} /> :
                         < Bell size={24} />}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">{n.title}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                               {n.createdAt?.toDate().toLocaleString()}
                            </p>
                         </div>
                         <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">{n.message}</p>
                         <div className="flex items-center gap-3 pt-4">
                            {!n.read && (
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="px-4 py-2 bg-[#00a2ff] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#0091e6] transition-all"
                              >
                                Mark Processed
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(n.id)}
                              className="px-4 py-2 text-gray-300 hover:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                              Archive Entry
                            </button>
                         </div>
                      </div>

                      <div className="relative">
                         <button 
                           onClick={() => setActiveMenuId(activeMenuId === n.id ? null : n.id)}
                           className="h-10 w-10 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center"
                         >
                            <MoreVertical size={18} />
                         </button>
                         
                         <AnimatePresence>
                           {activeMenuId === n.id && (
                             <>
                               <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                 className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                               >
                                 <button 
                                   onClick={() => deleteNotification(n.id)}
                                   className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                 >
                                   <Trash2 size={14} />
                                   Delete Log
                                 </button>
                               </motion.div>
                             </>
                           )}
                         </AnimatePresence>
                      </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
