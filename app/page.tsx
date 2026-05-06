'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion } from 'motion/react';
import { TrendingUp, ShoppingBag, FileText, Users, ShoppingCart, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { name: 'Total Sales', value: 'E0', icon: TrendingUp, color: 'bg-green-100 text-green-700' },
    { name: 'Orders Today', value: '0', icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { name: 'Active Quotes', value: '0', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Total Customers', value: '0', icon: Users, color: 'bg-purple-100 text-purple-700' },
  ]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recent Activities listener
    const qRecent = query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivities(activities);
    });

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
    });

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setStats(prev => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], value: snapshot.size.toString() }
      ]);
    });

    return () => {
      unsubscribeRecent();
      unsubscribeDocs();
      unsubscribeCustomers();
    };
  }, []);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#7a2b22]">Business Overview</h1>
          <p className="text-[#3d2b1f]/60">Welcome back to Insika Kitchen management console.</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl bg-white p-6 shadow-sm border border-[#7a2b22]/5"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#3d2b1f]/60">{stat.name}</p>
                  <p className="text-2xl font-bold text-[#3d2b1f]">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white p-8 shadow-sm border border-[#7a2b22]/5"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#7a2b22]">Recent Activities</h2>
              <Clock className="text-[#7a2b22]/20" size={20} />
            </div>
            <div className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 border-b border-[#fdfcf0] pb-4 last:border-0 last:pb-0">
                    <div className={`mt-2 h-2 w-2 rounded-full ${
                      activity.type === 'invoice' ? 'bg-blue-500' : 
                      activity.type === 'receipt' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#3d2b1f]">
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} #{activity.documentNumber}
                        </p>
                        <span className="text-xs font-black uppercase text-[#7a2b22]">E{activity.totalAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-[#3d2b1f]/40 font-bold uppercase tracking-widest mt-1">
                        {activity.createdAt?.toDate ? format(activity.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-[#3d2b1f]/40">
                  <FileText className="mx-auto mb-2 opacity-20" size={32} />
                  <p>No recent activity found.</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#7a2b22] p-8 text-white shadow-xl"
          >
            <h2 className="mb-6 font-serif text-xl font-bold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/pos" className="group rounded-xl bg-white/10 p-5 text-center transition-all hover:bg-white/20">
                <ShoppingCart className="mx-auto mb-3 transition-transform group-hover:scale-110" />
                <span className="text-xs font-black uppercase tracking-widest">New Order</span>
              </Link>
              <Link href="/products" className="group rounded-xl bg-white/10 p-5 text-center transition-all hover:bg-white/20">
                <Package className="mx-auto mb-3 transition-transform group-hover:scale-110" />
                <span className="text-xs font-black uppercase tracking-widest">Manage Stock</span>
              </Link>
              <Link href="/customers" className="group rounded-xl bg-white/10 p-5 text-center transition-all hover:bg-white/20">
                <Users className="mx-auto mb-3 transition-transform group-hover:scale-110" />
                <span className="text-xs font-black uppercase tracking-widest">Add Customer</span>
              </Link>
              <Link href="/documents" className="group rounded-xl bg-white/10 p-5 text-center transition-all hover:bg-white/20">
                <FileText className="mx-auto mb-3 transition-transform group-hover:scale-110" />
                <span className="text-xs font-black uppercase tracking-widest">History</span>
              </Link>
            </div>
            <div className="mt-8 rounded-xl bg-white/5 p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">System Status</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-white/80">All systems operational</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
