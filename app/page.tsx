'use client';

import React from 'react';
import { Shell } from '@/components/Shell';
import { motion } from 'motion/react';
import { TrendingUp, ShoppingBag, FileText, Users, ShoppingCart, Package } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { name: 'Total Sales', value: 'E4,250', icon: TrendingUp, color: 'bg-green-100 text-green-700' },
  { name: 'Orders Today', value: '12', icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
  { name: 'Active Quotes', value: '5', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
  { name: 'New Customers', value: '3', icon: Users, color: 'bg-purple-100 text-purple-700' },
];

export default function Dashboard() {
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
            <h2 className="mb-6 font-serif text-xl font-bold text-[#7a2b22]">Recent Activities</h2>
            <div className="space-y-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start gap-4 border-b border-[#fdfcf0] pb-4 last:border-0 last:pb-0">
                  <div className="h-2 w-2 mt-2 rounded-full bg-[#d4a017]" />
                  <div>
                    <p className="font-medium text-[#3d2b1f]">Invoice #INV-0023 generated</p>
                    <p className="text-sm text-[#3d2b1f]/50">Customer: Thabo Mdluli • 2 hours ago</p>
                  </div>
                </div>
              ))}
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
              <Link href="/pos" className="rounded-lg bg-white/10 p-4 text-center transition-colors hover:bg-white/20">
                <ShoppingCart className="mx-auto mb-2" />
                <span className="text-sm font-medium">New Order</span>
              </Link>
              <Link href="/products" className="rounded-lg bg-white/10 p-4 text-center transition-colors hover:bg-white/20">
                <Package className="mx-auto mb-2" />
                <span className="text-sm font-medium">Manage Stock</span>
              </Link>
              <Link href="/customers" className="rounded-lg bg-white/10 p-4 text-center transition-colors hover:bg-white/20">
                <Users className="mx-auto mb-2" />
                <span className="text-sm font-medium">Add Customer</span>
              </Link>
              <Link href="/documents" className="rounded-lg bg-white/10 p-4 text-center transition-colors hover:bg-white/20">
                <FileText className="mx-auto mb-2" />
                <span className="text-sm font-medium">History</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
