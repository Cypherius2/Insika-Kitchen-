export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  businessName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Transaction {
  id: string;
  type: 'INVOICE' | 'EXPENSE';
  total: number;
  status: string;
  customerName?: string;
  createdAt: any;
}
