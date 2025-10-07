export interface WebChatConfig {
  _id?: string;
  companyId: string; // Firebase Auth UID do admin que criou
  companyName: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappVerifyToken: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AppUser {
  _id?: string;
  firebaseAuthUid: string;
  email: string;
  name: string;
  role: 'admin' | 'attendant';
  companyId: string; // Vinculado à empresa
  createdAt: Date;
  isActive: boolean;
}

export type UserRole = 'admin' | 'attendant';
