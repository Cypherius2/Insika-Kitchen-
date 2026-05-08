'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  ChefHat,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'POS', icon: ShoppingCart, href: '/pos' },
  { name: 'Documents', icon: FileText, href: '/documents' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Customers', icon: Users, href: '/customers' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

import { useSettings } from '@/lib/hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LogIn } from 'lucide-react';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, loading: settingsLoading } = useSettings();
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#fdfcf0] text-[#3d2b1f] selection:bg-[#7a2b22] selection:text-white font-sans overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="absolute -top-24 -left-24 w-96 h-96 blur-[120px] rounded-full" 
          style={{ backgroundColor: `${settings.brandColor}15` }}
        />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-[#3d2b1f]/5 blur-[150px] rounded-full" />
      </div>

      {/* Floating Navigation Dock */}
      <nav 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex w-[95%] max-w-2xl items-center justify-between gap-2 p-2 rounded-[2rem] bg-white/95 backdrop-blur-3xl border shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all"
        style={{ borderColor: `${settings.brandColor}20` }}
      >
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex-1"
                draggable={false}
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "relative flex items-center justify-center gap-3 h-14 rounded-full transition-all duration-100",
                    isActive 
                      ? "px-6" 
                      : "text-[#3d2b1f]/50 hover:text-[#3d2b1f] hover:bg-[#3d2b1f]/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full shadow-lg"
                      style={{ backgroundColor: settings.brandColor }}
                      transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <item.icon size={22} className={cn("relative z-10 transition-colors duration-100", isActive ? "text-white" : "group-hover:scale-110")} />
                  {isActive && (
                    <motion.span
                      layoutId="active-text"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10 text-sm font-black whitespace-nowrap overflow-hidden text-white"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

      {/* Main Content Area */}
      <main className="relative z-10 min-h-screen pb-56">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-12">
          {/* Header branding */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#7a2b22] text-white shadow-lg"
                style={{ backgroundColor: settings.brandColor, boxShadow: `0 8px 20px ${settings.brandColor}33` }}
              >
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <ChefHat size={24} />
                )}
              </div>
              <span 
                className="font-serif text-xl font-black tracking-tighter"
                style={{ color: settings.brandColor }}
              >
                {settings.businessName}
              </span>
            </div>
            {user ? (
              <button 
                onClick={logout}
                className="group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest text-[#3d2b1f]/40 border transition-all hover:bg-[#7a2b22] hover:text-white hover:border-[#7a2b22]"
                style={{ borderColor: `${settings.brandColor}10` }}
              >
                <LogOut size={14} className="transition-colors group-hover:text-white" />
                Sign Out
              </button>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest text-white border transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: settings.brandColor, borderColor: settings.brandColor }}
              >
                <LogIn size={14} />
                Sign In
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
