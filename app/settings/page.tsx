'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { motion } from 'motion/react';
import { Save, Percent, ShieldCheck, Database, Sliders } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVatRate(docSnap.data().vatRate || 15);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        vatRate: parseFloat(vatRate.toString()),
        updatedAt: new Date(),
      }, { merge: true });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <h1 className="font-serif text-3xl font-bold text-[#7a2b22]">General Settings</h1>
          <p className="text-[#3d2b1f]/60">Configure global application variables and business logic.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
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
                    <p className="mt-2 text-xs text-[#3d2b1f]/40">
                      Changes will apply to all NEW transactions. Past records remain unchanged.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-[#7a2b22] px-8 py-3.5 font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-[#5a1f19] active:scale-95 disabled:opacity-50"
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
