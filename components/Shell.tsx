'use client';

import React from 'react';
import { useFirebase } from './FirebaseProvider';
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
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'POS', icon: ShoppingCart, href: '/pos' },
  { name: 'Documents', icon: FileText, href: '/documents' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Customers', icon: Users, href: '/customers' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, login, logout } = useFirebase();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fdfcf0]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <ChefHat size={48} className="text-[#7a2b22]" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fdfcf0] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-[#7a2b22]/10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-[#fdfcf0] p-4 border-2 border-[#7a2b22]">
              <ChefHat size={48} className="text-[#7a2b22]" />
            </div>
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-[#7a2b22]">Insika Kitchen</h1>
          <p className="mb-8 text-[#3d2b1f]/60">Manage your bakery with precision and professional documents.</p>
          <button 
            onClick={login}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#7a2b22] px-6 py-3 font-semibold text-white transition-all hover:bg-[#5a1f19] active:scale-95"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfcf0]">
      {/* Sidebar - Desktop only */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="relative z-20 hidden flex-col border-r border-[#7a2b22]/10 bg-white shadow-sm md:flex"
      >
        <div className="flex h-20 items-center justify-between px-6">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <ChefHat className="text-[#7a2b22]" />
                <span className="font-serif text-xl font-bold text-[#7a2b22]">Insika ERP</span>
              </motion.div>
            ) : (
              <motion.div 
                key="short"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex w-full justify-center"
              >
                <ChefHat className="text-[#7a2b22]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive 
                    ? 'bg-[#7a2b22] text-white shadow-md' 
                    : 'text-[#3d2b1f]/70 hover:bg-[#fdfcf0] hover:text-[#7a2b22]'
                }`}
              >
                <item.icon size={22} className="shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#7a2b22]/10 p-3">
          <button 
            onClick={logout}
            className="flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={22} className="shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Floating Bottom Navigation - Mobile only */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:hidden">
        <motion.nav 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex h-14 items-center gap-1.5 rounded-full border border-white/10 bg-[#1a120b]/90 p-1.5 shadow-2xl backdrop-blur-2xl"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center justify-center transition-all ${
                  isActive 
                    ? 'rounded-full bg-white px-4 py-2 text-black shadow-lg' 
                    : 'h-10 w-10 text-white/50 hover:text-white'
                }`}
              >
                <item.icon size={ isActive ? 18 : 20 } className={isActive ? 'mr-2' : ''} />
                {isActive && (
                  <motion.span 
                    layoutId="pill-text"
                    className="text-xs font-bold leading-none tracking-tight"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            );
          })}
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button 
            onClick={logout}
            className="flex h-10 w-10 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 active:scale-95"
          >
            <LogOut size={20} />
          </button>
        </motion.nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-[#7a2b22]/10 bg-white px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden rounded-lg p-2 text-[#3d2b1f]/60 hover:bg-[#fdfcf0] md:block"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <ChefHat className="text-[#7a2b22]" />
              <span className="font-serif text-xl font-bold text-[#7a2b22]">Insika Kitchen</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#c4900a]">Insika Kitchen</p>
              <p className="text-xs text-[#3d2b1f]/60">{user.email}</p>
            </div>
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#d4a017]">
              <Image 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="User" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
