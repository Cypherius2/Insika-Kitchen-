'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { 
  Settings, 
  ShieldCheck, 
  Globe, 
  Bell, 
  Database, 
  Cpu, 
  RefreshCw,
  Save,
  Terminal,
  Layers,
  Users,
  Shield,
  User,
  Loader2,
  Plus,
  Trash2 as TrashIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db, config } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  updateDoc, 
  doc,
  deleteDoc,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('identity');
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    displayName: '', 
    password: '',
    role: 'user' as 'admin' | 'user' 
  });

  useEffect(() => {
    if (activeTab === 'users' && profile?.role === 'admin') {
      setLoadingUsers(true);
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUserProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingUsers(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setLoadingUsers(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, profile]);

  if (authLoading) return null;

  if (profile?.role !== 'admin') {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center">
           <div className="h-32 w-32 bg-[#00a2ff]/5 rounded-[3rem] flex items-center justify-center mb-8 text-[#00a2ff] shadow-inner">
              <Shield size={64} strokeWidth={1} />
           </div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 leading-none">Access Restricted</h2>
           <p className="text-gray-500 max-w-sm font-medium leading-relaxed mb-10">
             Your node signature does not have administrative clearance to access system protocols and matrix parameters.
           </p>
           <button 
             onClick={() => window.location.href = '/'}
             className="px-10 py-4 bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
           >
             Return to Hub
           </button>
           <p className="mt-8 text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
             Protocol Isolation: Active
           </p>
        </div>
      </Shell>
    );
  }

  const tabs = [
    { id: 'identity', label: 'Identity Matrix', icon: ShieldCheck },
    { id: 'operational', label: 'Operational Logic', icon: Settings },
    { id: 'infrastructure', label: 'Infrastructure', icon: Database },
    { id: 'users', label: 'User Management', icon: Users },
  ];

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to terminate this node clearance?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.password.length < 6) {
      toast.error('Identity Shield Error: Password must be at least 6 characters');
      return;
    }

    setCreatingUser(true);
    let secondaryApp;
    try {
      // 1. Initialize secondary app to create user without logging out the admin
      const secondaryAppName = `app_${Date.now()}`;
      secondaryApp = initializeApp(config, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newUser.email, 
        newUser.password
      );
      
      const createdUser = userCredential.user;

      // 3. Set display name in Auth
      await updateProfile(createdUser, {
        displayName: newUser.displayName
      });

      // 4. Create the Firestore profile document
      await setDoc(doc(db, 'users', createdUser.uid), {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        uid: createdUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      toast.success(`Node ${newUser.displayName} successfully provisioned in the cluster`);
      setIsAddUserOpen(false);
      setNewUser({ email: '', displayName: '', password: '', role: 'user' });
    } catch (error: any) {
      console.error('Provisioning failure:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Identity Conflict: This email node is already registered in the central auth cluster.');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error(
          <div className="space-y-2">
            <p className="font-bold">Protocol Error: Authentication Method Restricted</p>
            <p className="text-[10px] opacity-80">Email/Password authentication is not enabled in your Firebase project. This is required for manual node provisioning.</p>
            <a 
              href={`https://console.firebase.google.com/project/${config.projectId}/authentication/providers`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-3 py-1 bg-white text-black rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Enable via Command Center
            </a>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(`Provisioning Failed: ${error.message}`);
        handleFirestoreError(error, OperationType.CREATE, 'users');
      }
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setCreatingUser(false);
    }
  };

  return (
    <Shell>
      <div className="p-10 space-y-10 max-w-6xl mx-auto">
        <header className="flex items-center justify-between">
           <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#00a2ff]">
                 <Settings size={16} />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Core System Control</p>
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">System Settings</h2>
           </div>
           
           {profile?.role === 'admin' && (
             <button className="flex items-center gap-3 px-8 py-4 bg-[#00a2ff] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">
                <Save size={16} />
                Synchronize Data
             </button>
           )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Navigation Tabs */}
           <div className="lg:col-span-4 space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-6 rounded-[2rem] border transition-all duration-300 text-left group",
                    activeTab === tab.id 
                      ? "bg-[#0a0a0a] border-transparent text-white shadow-2xl" 
                      : "bg-white border-gray-100 text-gray-400 hover:border-[#00a2ff]/30 hover:bg-[#00a2ff]/5"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                    activeTab === tab.id ? "bg-[#00a2ff] text-white" : "bg-gray-50 text-gray-400 group-hover:bg-[#00a2ff]/10 group-hover:text-[#00a2ff]"
                  )}>
                    <tab.icon size={20} />
                  </div>
                  <div>
                    <h4 className={cn("text-sm font-black tracking-tight", activeTab === tab.id ? "text-white" : "text-gray-900 group-hover:text-[#00a2ff]")}>{tab.label}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Group</p>
                  </div>
                </button>
              ))}

              <div className="bg-[#f0f9ff]/50 border border-blue-100 rounded-[2rem] p-8 mt-10">
                 <div className="flex items-center gap-4 mb-4">
                    <RefreshCw size={18} className="text-[#00a2ff] animate-spin" style={{ animationDuration: '4s' }} />
                    <h5 className="text-xs font-black uppercase tracking-widest text-[#00a2ff]">Auto-Sync Logic</h5>
                 </div>
                 <p className="text-xs font-medium text-blue-900/60 leading-relaxed">
                   Synchronizing all terminal nodes with global cloud matrix every 300 seconds.
                 </p>
              </div>
           </div>

           {/* Panels */}
           <div className="lg:col-span-8 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150">
                 <Layers size={200} />
              </div>

              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none capitalize">{activeTab.replace('-', ' ')} Protocols</h3>
                     {activeTab === 'users' && profile?.role === 'admin' && (
                        <button 
                           onClick={() => setIsAddUserOpen(true)}
                           className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#00a2ff] transition-all shadow-lg active:scale-95"
                        >
                           <Plus size={14} />
                           Provision New Node
                        </button>
                     )}
                  </div>
                 <p className="text-sm font-medium text-gray-400">Manage organizational identity and infrastructure parameters.</p>
              </div>

              <div className="space-y-8 relative z-10">
                 {activeTab === 'users' ? (
                   <div className="space-y-6">
                      {loadingUsers ? (
                         <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-30">
                            <Loader2 className="animate-spin text-[#00a2ff]" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Identity Nodes...</p>
                         </div>
                      ) : (
                          <div className="overflow-x-auto">
                             <table className="w-full">
                                <thead>
                                   <tr className="border-b border-gray-50">
                                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Node Identity</th>
                                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Clearance Level</th>
                                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                   {userProfiles.map((u) => (
                                      <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50/50">
                                         <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                               <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm">
                                                  {u.photoURL ? (
                                                     <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                  ) : (
                                                     <User size={18} />
                                                  )}
                                               </div>
                                               <div>
                                                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{u.displayName || 'Anonymous Node'}</p>
                                                  <p className="text-[10px] font-bold text-gray-400 tracking-tight">{u.email}</p>
                                               </div>
                                            </div>
                                         </td>
                                         <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                               <select 
                                                  value={u.role || 'user'}
                                                  onChange={(e) => updateUserRole(u.id, e.target.value as 'admin' | 'user')}
                                                  disabled={u.email === profile?.email}
                                                  className={cn(
                                                     "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 outline-none focus:ring-4 transition-all min-w-[120px] cursor-pointer shadow-sm",
                                                     u.role === 'admin' 
                                                        ? "bg-[#00a2ff] text-white focus:ring-[#00a2ff]/10" 
                                                        : "bg-white text-gray-400 focus:ring-gray-100 hover:text-gray-900",
                                                     u.email === profile?.email ? "opacity-50 cursor-not-allowed" : ""
                                                  )}
                                               >
                                                  <option value="user">USER NODE</option>
                                                  <option value="admin">ADMIN NODE</option>
                                               </select>
                                               {u.email !== profile?.email && (
                                                  <button 
                                                     onClick={() => deleteUser(u.id)}
                                                     className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                  >
                                                     <TrashIcon size={14} />
                                                  </button>
                                               )}
                                            </div>
                                         </td>
                                         <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 text-emerald-500">
                                               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                               <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                            </div>
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                      )}
                   </div>
                 ) : (
                   <div className="space-y-8">
                      <div className="grid gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Business Designation</label>
                            <input 
                              type="text" 
                              disabled={profile?.role !== 'admin'}
                              defaultValue={profile?.businessName || "MiraTech Industries"}
                              className={cn(
                                "w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black transition-all",
                                profile?.role === 'admin' ? "focus:ring-4 focus:ring-[#00a2ff]/10 focus:border-[#00a2ff]" : "opacity-60 cursor-not-allowed"
                              )}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">VAT Node Rate (%)</label>
                               <input 
                                 type="number" 
                                 disabled={profile?.role !== 'admin'}
                                 defaultValue="15"
                                 className={cn(
                                   "w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black transition-all",
                                   profile?.role === 'admin' ? "focus:ring-4 focus:ring-[#00a2ff]/10 focus:border-[#00a2ff]" : "opacity-60 cursor-not-allowed"
                                 )}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Operational Region</label>
                               <select 
                                 disabled={profile?.role !== 'admin'}
                                 className={cn(
                                   "w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black transition-all appearance-none",
                                   profile?.role === 'admin' ? "focus:ring-4 focus:ring-[#00a2ff]/10 focus:border-[#00a2ff]" : "opacity-60 cursor-not-allowed"
                                 )}
                               >
                                  <option>Eswatini (SZ)</option>
                                  <option>Global Edge (Any)</option>
                               </select>
                            </div>
                         </div>
                      </div>

                      <div className="pt-10 border-t border-gray-50">
                         <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-3">
                            <Terminal size={14} className="text-[#00a2ff]" />
                            Infrastructure Diagnostic
                         </h4>
                         <div className="p-8 rounded-[2rem] bg-[#fafafa] border border-gray-100 flex items-center justify-between group cursor-help">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                                  <ShieldCheck size={20} />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-gray-900">Cloud Firestore Node</p>
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Link • Status Nominal</p>
                               </div>
                            </div>
                            <Cpu size={20} className="text-gray-200 group-hover:text-[#00a2ff] transition-colors" />
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAddUserOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900"
              >
                <X size={20} />
              </button>

              <form onSubmit={createUser} className="p-12 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[#00a2ff]">
                    <Plus size={16} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Provisioning</p>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">New Node Entry</h3>
                  <p className="text-sm font-medium text-gray-400 italic">Initialize new operator parameters in the cluster.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Node Alias</label>
                    <input 
                      type="text" 
                      required
                      value={newUser.displayName}
                      onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                      placeholder="e.g. Agent Phoenix"
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#00a2ff]/10 focus:border-[#00a2ff] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email Identity</label>
                    <input 
                      type="email" 
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="operator@miratech.os"
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#00a2ff]/10 focus:border-[#00a2ff] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Access Key (Password)</label>
                    <input 
                      type="password" 
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#00a2ff]/10 focus:border-[#00a2ff] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Clearance Level</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['user', 'admin'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setNewUser({...newUser, role: r as any})}
                          className={cn(
                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            newUser.role === r 
                              ? "bg-[#0a0a0a] text-white border-transparent shadow-xl" 
                              : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                          )}
                        >
                          {r} NODE
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                  >
                    Cancel initialization
                  </button>
                  <button 
                    type="submit"
                    disabled={creatingUser}
                    className="flex-1 py-5 bg-[#00a2ff] text-white text-[10px] font-black uppercase tracking-widest rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,162,255,0.4)] hover:bg-black transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                  >
                    {creatingUser ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Syncing...
                      </>
                    ) : 'Provision Node'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
