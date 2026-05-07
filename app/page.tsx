'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion } from 'motion/react';
import { TrendingUp, ShoppingBag, FileText, Users, ShoppingCart, Package, Clock, Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

import { useSettings } from '@/lib/hooks';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Dashboard() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { name: 'Total Sales', value: 'E0', icon: TrendingUp, color: 'bg-green-100 text-green-700' },
    { name: 'Orders Today', value: '0', icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { name: 'Active Quotes', value: '0', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Total Customers', value: '0', icon: Users, color: 'bg-purple-100 text-purple-700' },
  ]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
        if (!user) setLoading(false);
        return;
    }
    // Recent Activities listener
    const qRecent = query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivities(activities);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    // Stats listeners
    const unsubscribeDocs = onSnapshot(collection(db, 'documents'), (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      
      // Total Sales (only invoices and receipts)
      const totalSales = docs
        .filter(d => d.type === 'invoice' || d.type === 'receipt')
        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

      // Orders Today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const ordersToday = docs.filter(d => {
        const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        return createdAt >= startOfToday;
      }).length;

      // Active Quotes
      const activeQuotes = docs.filter(d => d.type === 'quotation').length;

      setStats(prev => [
        { ...prev[0], value: `E${totalSales.toLocaleString()}` },
        { ...prev[1], value: ordersToday.toString() },
        { ...prev[2], value: activeQuotes.toString() },
        prev[3]
      ]);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setStats(prev => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], value: snapshot.size.toString() }
      ]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    return () => {
      unsubscribeRecent();
      unsubscribeDocs();
      unsubscribeCustomers();
    };
  }, [user]);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 
            className="font-serif text-4xl font-black tracking-tight"
            style={{ color: settings.brandColor }}
          >
            Welcome, {settings.businessName}
          </h1>
          <p className="mt-2 text-[#3d2b1f]/60 font-medium">Here&apos;s your kitchen status for today.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {stats.map((stat) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white p-6 shadow-xl border transition-all hover:-translate-y-1"
              style={{ borderColor: `${settings.brandColor}0D`, boxShadow: `0 10px 30px ${settings.brandColor}08` }}
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-3 shadow-inner`} style={{ backgroundColor: stat.color.split(' ')[0].replace('bg-', '') === 'green-100' ? '#dcfce7' : stat.color.split(' ')[0].replace('bg-', '') === 'blue-100' ? '#dbeafe' : stat.color.split(' ')[0].replace('bg-', '') === 'yellow-100' ? '#fef9c3' : '#f3e8ff' }}>
                  <stat.icon size={28} style={{ color: stat.color.split(' ')[1].replace('text-', '') === 'green-700' ? '#15803d' : stat.color.split(' ')[1].replace('text-', '') === 'blue-700' ? '#1d4ed8' : stat.color.split(' ')[1].replace('text-', '') === 'yellow-700' ? '#a16207' : '#7e22ce' }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3d2b1f]/40">{stat.name}</p>
                  <p className="text-2xl font-black text-[#3d2b1f]">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 rounded-3xl bg-white p-8 shadow-xl border"
            style={{ borderColor: `${settings.brandColor}0D` }}
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-black" style={{ color: settings.brandColor }}>Recent Activities</h2>
              <Clock style={{ color: `${settings.brandColor}33` }} size={24} />
            </div>
            <div className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="group flex items-center gap-5 border-b pb-6 last:border-0 last:pb-0" style={{ borderBottomColor: `${settings.brandColor}0D` }}>
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner",
                      activity.type === 'invoice' ? 'bg-blue-50 text-blue-500' : 
                      activity.type === 'receipt' ? 'bg-green-50 text-green-500' : 'bg-yellow-50 text-yellow-500'
                    )}>
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p 
                          className="font-bold text-[#3d2b1f] transition-colors"
                          style={{ color: '#3d2b1f' }}
                        >
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} #{activity.documentNumber}
                        </p>
                        <span className="text-sm font-black" style={{ color: settings.brandColor }}>E{activity.totalAmount?.toFixed(2)}</span>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#3d2b1f]/30 mt-1">
                        {activity.createdAt?.toDate ? format(activity.createdAt.toDate(), 'MMM d, h:mm a') : 'Recent'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#7a2b22]/5">
                    <FileText style={{ color: `${settings.brandColor}33` }} size={32} />
                  </div>
                  <p className="font-bold text-[#3d2b1f]/40">No recent activity found.</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl p-8 text-white shadow-2xl"
            style={{ backgroundColor: settings.brandColor, boxShadow: `0 20px 50px ${settings.brandColor}33` }}
          >
            <h2 className="mb-8 font-serif text-2xl font-black">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/pos" className="group flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 text-center transition-all hover:bg-white/20 active:scale-95">
                <div className="rounded-xl bg-white/10 p-3 group-hover:scale-110 transition-transform">
                  <ShoppingCart size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">New Order</span>
              </Link>
              <Link href="/products?action=add" className="group flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 text-center transition-all hover:bg-white/20 active:scale-95">
                <div className="rounded-xl bg-white/10 p-3 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Product</span>
              </Link>
              <Link href="/customers?action=add" className="group flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 text-center transition-all hover:bg-white/20 active:scale-95">
                <div className="rounded-xl bg-white/10 p-3 group-hover:scale-110 transition-transform">
                  <UserPlus size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Client</span>
              </Link>
              <Link href="/documents" className="group flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 text-center transition-all hover:bg-white/20 active:scale-95">
                <div className="rounded-xl bg-white/10 p-3 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Documents</span>
              </Link>
            </div>
            
            <div className="mt-10 rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Kitchen Status</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-400 animate-ping" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-[#fdfcf0]">Online & Ready</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
