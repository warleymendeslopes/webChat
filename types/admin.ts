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
  _id: string;
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

// Chat Assignment System
export type ChatAssignmentStatus = 'new' | 'assigned' | 'active' | 'resolved' | 'expired';

export interface ChatAssignment {
  _id?: string;
  chatId: string;
  companyId: string;
  assignedTo: string | null; // ID do atendente ou null se não atribuído
  status: ChatAssignmentStatus;
  assignedAt?: Date;
  lastActivityAt: Date;
  lastCustomerMessageAt?: Date; // Última mensagem DO cliente (para janela 24h)
  lastAttendantMessageAt?: Date; // Última mensagem DO atendente
  createdAt: Date;
  updatedAt: Date;
}

// Attendant Status System
export type AttendantStatusType = 'available' | 'busy' | 'away' | 'offline';

export interface AttendantStatus {
  _id?: string;
  userId: string;
  companyId: string;
  status: AttendantStatusType;
  activeChats: number;
  maxChats: number; // Limite de chats simultâneos
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Distribution Strategy
export type DistributionStrategy = 'round_robin' | 'least_active' | 'balanced';

export interface DistributionConfig {
  companyId: string;
  strategy: DistributionStrategy;
  autoAssign: boolean; // Atribuir automaticamente novos chats
  reassignAfterHours: number; // Reatribuir após X horas de inatividade
  maxChatsPerAttendant: number;
}
