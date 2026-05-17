// Abstract base service for Firestore operations
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';

export class BaseService {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string) {
    const docRef = doc(db, this.collectionName, id);
    return getDoc(docRef);
  }

  async create(data: any) {
    return addDoc(collection(db, this.collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(id: string, data: any) {
    const docRef = doc(db, this.collectionName, id);
    return updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string) {
    const docRef = doc(db, this.collectionName, id);
    return deleteDoc(docRef);
  }
}
