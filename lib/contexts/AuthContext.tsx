'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  businessName?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          const userEmail = user.email?.toLowerCase();
          const isAdminEmail = userEmail === 'mrcypher68@gmail.com';

          // Auto-upgrade primary user to admin or ensure role exists
          if (!data.role || (isAdminEmail && data.role !== 'admin')) {
            const updatedProfile = { 
              ...data, 
              role: (isAdminEmail ? 'admin' : (data.role || 'user')) as 'admin' | 'user' 
            };
            await setDoc(docRef, updatedProfile, { merge: true });
            setProfile(updatedProfile);
          } else {
            setProfile(data);
          }
        } else {
          const userEmail = user.email?.toLowerCase();
          const isAdminEmail = userEmail === 'mrcypher68@gmail.com';

          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: isAdminEmail ? 'admin' : 'user',
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[#0a0a0a]">
        <div className="relative mb-8 h-32 w-32 animate-pulse">
           <Logo 
            src="/logo.png" 
            className="h-full w-full"
            size={64}
          />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#00a2ff]" />
          <p className="text-sm font-black tracking-widest text-white/50 uppercase">MiraTech Link Stabilizing</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
