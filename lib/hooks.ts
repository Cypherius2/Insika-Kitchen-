import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  getDoc,
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  return { products, loading };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });
    return () => unsubscribe();
  }, []);

  return { customers, loading };
}

export async function createDocument(orderData: any) {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Get and increment counter
      const counterRef = doc(db, 'counters', orderData.type);
      const counterSnap = await transaction.get(counterRef);
      
      let nextNumber = 1;
      if (counterSnap.exists()) {
        nextNumber = counterSnap.data().currentNumber + 1;
        transaction.update(counterRef, { currentNumber: nextNumber });
      } else {
        transaction.set(counterRef, { type: orderData.type, currentNumber: 1 });
      }

      const docNumber = `${orderData.type.toUpperCase()}-${String(nextNumber).padStart(5, '0')}`;
      
      // 2. Create document
      const docRef = doc(collection(db, 'documents'));
      const finalData = {
        ...orderData,
        documentNumber: docNumber,
        createdAt: serverTimestamp(),
      };
      transaction.set(docRef, finalData);

      // 3. Update stock (optional but recommended in blueprint)
      for (const item of orderData.items) {
        const productRef = doc(db, 'products', item.productId);
        transaction.update(productRef, { stock: increment(-item.quantity) });
      }

      return { id: docRef.id, documentNumber: docNumber };
    });
    
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'documents');
  }
}
