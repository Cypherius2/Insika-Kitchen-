'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion } from 'motion/react';
import { Save, Percent, ShieldCheck, Database, Sliders } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const [vatRate, setVatRate] = useState(15);
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#7a2b22');
  const [businessName, setBusinessName] = useState('Insika Kitchen');
  const [autoEmail, setAutoEmail] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      if (!db || !user) {
        if (!user) setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVatRate(data.vatRate || 15);
          setLogoUrl(data.logoUrl || '');
          setBrandColor(data.brandColor || '#7a2b22');
          setBusinessName(data.businessName || 'Insika Kitchen');
          setAutoEmail(data.autoEmail ?? true);
          setLowStockThreshold(data.lowStockThreshold || 10);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        vatRate: parseFloat(vatRate.toString()),
        logoUrl,
        brandColor,
        businessName,
        autoEmail,
        lowStockThreshold: parseInt(lowStockThreshold.toString()),
        updatedAt: new Date(),
      }, { merge: true });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-8 pb-32">
        <header>
          <h1 className="font-serif text-3xl font-bold text-[#7a2b22]">General Settings</h1>
          <p className="text-[#3d2b1f]/60">Configure global application variables and business branding.</p>
        </header>

        {/* Branding Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-[#3d2b1f]">Business Branding</h2>
            <p className="text-sm text-[#3d2b1f]/50">Customize your brand identity including logo and theme colors.</p>
          </div>
          
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-[#7a2b22]/10 bg-white p-6 shadow-sm space-y-6">
              {loading ? (
                <div className="flex animate-pulse space-x-4">
                  <div className="h-40 w-full rounded-lg bg-gray-100" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-black uppercase tracking-widest text-[#7a2b22]/60">Business Name</label>
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-xl border border-[#7a2b22]/10 bg-[#fdfcf0]/30 p-4 font-bold text-[#3d2b1f] outline-none transition-all focus:border-[#7a2b22]/30 focus:bg-white"
                      placeholder="e.g. Insika Kitchen"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black uppercase tracking-widest text-[#7a2b22]/60">Logo URL</label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <input 
                          type="url" 
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full rounded-xl border border-[#7a2b22]/10 bg-[#fdfcf0]/30 p-4 font-bold text-[#3d2b1f] outline-none transition-all focus:border-[#7a2b22]/30 focus:bg-white"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#7a2b22]/10 bg-[#fdfcf0]/50">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Preview" className="h-full w-full object-contain" />
                        ) : (
                          <Database className="text-[#7a2b22]/20" size={24} />
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#3d2b1f]/40">Provide a direct link to your bakery logo (transparent PNG recommended).</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black uppercase tracking-widest text-[#7a2b22]/60">Brand Color</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-12 w-24 cursor-pointer rounded-lg border-none p-0"
                      />
                      <input 
                        type="text" 
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="flex-1 rounded-xl border border-[#7a2b22]/10 bg-[#fdfcf0]/30 p-4 font-mono font-bold text-[#3d2b1f] outline-none transition-all focus:border-[#7a2b22]/30 focus:bg-white"
                        placeholder="#7a2b22"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 pt-8 border-t border-[#7a2b22]/10">
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-[#3d2b1f]">Tax Configuration</h2>
            <p className="text-sm text-[#3d2b1f]/50">Manage how taxes are applied to your documents and POS transactions.</p>
          </div>
          
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-[#7a2b22]/10 bg-white p-6 shadow-sm">
              {loading ? (
                <div className="flex animate-pulse space-x-4">
                  <div className="h-12 w-full rounded-lg bg-gray-100" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-black uppercase tracking-widest text-[#7a2b22]/60">VAT Rate (%)</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#3d2b1f]/40">
                        <Percent size={18} />
                      </div>
                      <input 
                        type="number" 
                        value={vatRate}
                        onChange={(e) => setVatRate(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#7a2b22]/10 bg-[#fdfcf0]/30 py-4 pl-12 pr-4 font-bold text-[#3d2b1f] outline-none transition-all focus:border-[#7a2b22]/30 focus:bg-white focus:ring-4 focus:ring-[#7a2b22]/5"
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-black uppercase tracking-widest text-[#7a2b22]/60">Low Stock Threshold</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#3d2b1f]/40">
                        <Database size={18} />
                      </div>
                      <input 
                        type="number" 
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#7a2b22]/10 bg-[#fdfcf0]/30 py-4 pl-12 pr-4 font-bold text-[#3d2b1f] outline-none transition-all focus:border-[#7a2b22]/30 focus:bg-white focus:ring-4 focus:ring-[#7a2b22]/5"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#3d2b1f]/40 font-bold">Products with stock at or below this level will be highlighted.</p>
                  </div>

                  <div>
                    <label className="mb-4 flex items-center justify-between">
                      <div>
                        <span className="block text-sm font-black uppercase tracking-widest text-[#7a2b22]/60">Auto-Email Documents</span>
                        <span className="text-xs text-[#3d2b1f]/40 font-bold">Automatically email PDF receipts to customers with an email address.</span>
                      </div>
                      <button 
                        onClick={() => setAutoEmail(!autoEmail)}
                        className={cn(
                          "relative h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none",
                          autoEmail ? "bg-green-500" : "bg-gray-200"
                        )}
                      >
                        <div 
                          className={cn(
                            "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200",
                            autoEmail ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </label>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-[#7a2b22] px-8 py-3.5 font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-[#5a1f19] active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-[#7a2b22]/10 pt-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-[#3d2b1f]">System Integrity</h2>
            <p className="text-sm text-[#3d2b1f]/50">Advanced diagnostic and configuration status.</p>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50/50 p-4">
              <div className="rounded-lg bg-green-100 p-2 text-green-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">Database Connection Stable</p>
                <p className="text-xs text-green-600/70">Connected to Firestore Instance</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Sliders size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Application Parameters</p>
                <p className="text-xs text-blue-600/70">Next.js 15 Standalone Mode</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
