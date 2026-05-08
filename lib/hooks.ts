'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

import { useAuth } from './contexts/AuthContext';

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      if (!user) setLoading(false);
      return;
    }
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, [user]);

  return { products, loading };
}

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      if (!user) setLoading(false);
      return;
    }
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));
    return () => unsubscribe();
  }, [user]);

  return { customers, loading };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ 
    vatRate: 15,
    logoUrl: '',
    brandColor: '#7a2b22',
    businessName: 'Insika Kitchen',
    autoEmail: true,
    lowStockThreshold: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      if (!user) setLoading(false);
      return;
    }
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings({ 
          vatRate: data.vatRate || 15,
          logoUrl: data.logoUrl || '',
          brandColor: data.brandColor || '#7a2b22',
          businessName: data.businessName || 'Insika Kitchen',
          autoEmail: data.autoEmail ?? true,
          lowStockThreshold: data.lowStockThreshold || 10
        });
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));
    return () => unsubscribe();
  }, [user]);

  return { settings, loading };
}
