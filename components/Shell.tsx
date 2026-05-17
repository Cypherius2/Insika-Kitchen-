'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Search,
  History as HistoryIcon,
  Trash2,
  Check,
  BellRing,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  read: boolean;
  createdAt: Timestamp;
}

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/pos', label: 'POS Terminal', icon: ShoppingCart },
  { href: '/products', label: 'Inventory', icon: Package },
  { href: '/customers', label: 'Directory', icon: Users },
  { href: '/documents', label: 'Documents', icon: HistoryIcon, adminOnly: true },
  { href: '/settings', label: 'Control Panel', icon: Settings, adminOnly: true },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && profile?.role !== 'admin') return false;
    return true;
  });

  React.useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-72 bg-[#0a0a0a] border-r border-white/5 flex-col shrink-0 relative z-30">
        <div className="p-8 flex items-center gap-4">
          <Logo src="/logo.png" size={32} />
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">MiraTech</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a2ff]/70 mt-1">Business OS</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-[#00a2ff] text-white shadow-[0_10px_30px_-10px_rgba(0,162,255,0.4)]" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-3xl p-5 mb-4 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-[#00a2ff]/20 flex items-center justify-center border border-[#00a2ff]/30 text-[#00a2ff]">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate">Node Access</p>
                <p className="text-xs font-bold text-white truncate">{profile?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Version 1.0.4 - Mirror Status: Sync</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-6 lg:px-10 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-4 lg:gap-6 flex-1 max-w-2xl">
             <div className="lg:hidden">
               <Logo src="/logo.png" size={24} />
             </div>
             <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a2ff] transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Scan SKU or Search Logic..." 
                  className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#00a2ff]/10 transition-all placeholder:text-gray-400" 
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "h-12 w-12 flex items-center justify-center rounded-2xl transition-all relative",
                  isNotificationsOpen ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 h-2 w-2 bg-[#00a2ff] rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                         <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight">Telemetry Alerts</h3>
                            <p className="text-[10px] font-bold text-gray-400">Security & Operational Data</p>
                         </div>
                         {unreadCount > 0 && (
                           <button 
                             onClick={markAllAsRead}
                             className="text-[10px] font-black uppercase tracking-widest text-[#00a2ff] hover:opacity-70 transition-opacity"
                           >
                             Clear All
                           </button>
                         )}
                      </div>

                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center opacity-20">
                            <BellRing size={32} className="mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Alerts Detected</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {notifications.map((n) => (
                              <div 
                                key={n.id} 
                                className={cn(
                                  "p-5 transition-colors cursor-pointer group",
                                  n.read ? "bg-white" : "bg-blue-50/30"
                                )}
                                onClick={() => markAsRead(n.id)}
                              >
                                <div className="flex gap-4">
                                  <div className={cn(
                                    "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
                                    n.type === 'CRITICAL' ? "bg-red-50 text-red-500" :
                                    n.type === 'WARNING' ? "bg-orange-50 text-orange-500" :
                                    n.type === 'SUCCESS' ? "bg-green-50 text-green-500" :
                                    "bg-blue-50 text-[#00a2ff]"
                                  )}>
                                    {n.type === 'CRITICAL' ? <Trash2 size={16} /> : 
                                     n.type === 'WARNING' ? <Info size={16} /> :
                                     < Bell size={16} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-gray-900 truncate mb-1">{n.title}</h4>
                                    <p className="text-[10px] font-medium text-gray-400 line-clamp-2 leading-relaxed">{n.message}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mt-2">
                                      {n.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {!n.read && (
                                    <div className="mt-1 h-2 w-2 rounded-full bg-[#00a2ff] shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <Link 
                          href="/notifications"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="w-full flex items-center justify-center py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-all"
                        >
                          View Activity Log
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>
            <div className="relative group/profile">
               <button className="flex items-center gap-4 cursor-pointer">
                  <div className="text-right hidden sm:block">
                     <p className="text-sm font-black text-gray-900 leading-none">{profile?.displayName || 'Operator'}</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{profile?.role || 'User'} clearance</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#00a2ff] p-[2px] hover:shadow-[0_0_20px_rgba(0,162,255,0.3)] transition-all">
                     <div className="h-full w-full rounded-2xl bg-white p-1 overflow-hidden">
                       <img 
                         src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}&background=00a2ff&color=fff`} 
                         alt="Profile" 
                         className="h-full w-full object-cover rounded-xl"
                       />
                     </div>
                  </div>
               </button>

               {/* Dropdown Menu */}
               <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-300 translate-y-2 group-hover/profile:translate-y-0">
                  <div className="p-6 border-b border-gray-50">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Authenticated Node</p>
                     <p className="text-sm font-black text-gray-900 truncate">{profile?.email}</p>
                  </div>
                  <div className="p-2">
                     {profile?.role === 'admin' && (
                        <Link 
                           href="/settings"
                           className="flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all group/item"
                        >
                           <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover/item:bg-[#00a2ff] group-hover/item:text-white transition-all">
                              <Settings size={14} />
                           </div>
                           <span className="text-xs font-bold">System Protocols</span>
                        </Link>
                     )}
                     <button 
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all group/item"
                     >
                        <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center group-hover/item:bg-red-500 group-hover/item:text-white transition-all">
                           <LogOut size={14} />
                        </div>
                        <span className="text-xs font-bold">Disconnect Node</span>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#fafafa] pb-32 lg:pb-0 scroll-smooth">
          {children}
        </div>

        {/* Mobile Bottom Navigation - Floating & Curved */}
        <AnimatePresence>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:hidden fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none"
          >
            <nav className="bg-[#0a0a0a]/90 border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-2 flex items-center justify-around w-full max-w-md pointer-events-auto relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#00a2ff]/20 blur-2xl pointer-events-none" />
              
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 px-4 rounded-2xl transition-all duration-300",
                      isActive ? "text-[#00a2ff]" : "text-white/40"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active-glow"
                        className="absolute inset-0 bg-[#00a2ff]/10 rounded-2xl blur-md"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="relative z-10"
                    >
                      <item.icon size={22} className={cn(isActive && "drop-shadow-[0_0_10px_#00a2ff]")} />
                    </motion.div>

                    <AnimatePresence>
                      {isActive && (
                        <motion.span 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 relative z-10"
                        >
                          {item.label.split(' ')[0]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {isActive && (
                      <motion.div 
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#00a2ff] rounded-full shadow-[0_0_12px_#00a2ff]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
