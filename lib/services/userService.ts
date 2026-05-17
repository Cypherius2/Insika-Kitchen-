import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { UserProfile } from '../models/types';

export class UserService {
  private static collection = 'users';

  static async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, this.collection, uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  static async updateRole(uid: string, role: 'admin' | 'user') {
    const docRef = doc(db, this.collection, uid);
    await updateDoc(docRef, { 
      role,
      updatedAt: Timestamp.now()
    });
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, this.collection));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  }
}
