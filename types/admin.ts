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

// AI Assistant Configuration
export type AiStatus = 'draft' | 'validating' | 'active' | 'error';

export interface AiQnaItem {
  question: string;
  answer: string;
}

export interface AiHandoffRules {
  keywords: string[];
  intents: string[]; // ex.: ['billing','complaint','cancellation']
  businessHoursOnly: boolean;
}

export interface AiConfig {
  _id?: string;
  companyId: string;
  provider: 'gemini';
  context: string; // descrição rica da empresa
  apiKeyRef: string; // referência à chave armazenada em segredo no servidor
  enabled: boolean;
  status: AiStatus;
  lastValidationAt?: Date;
  confidenceThreshold: number; // 0..1
  handoffRules: AiHandoffRules;
  maxConcurrentChats: number;
  qna: AiQnaItem[];
  createdAt: Date;
  updatedAt: Date;
}
