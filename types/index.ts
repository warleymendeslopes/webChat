export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  photoURL?: string;
  email?: string;
  firebaseAuthUid?: string; // Link to Firebase Auth user
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  isFromWhatsApp: boolean;
  whatsappMessageId?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageTimestamp: Date;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  isWhatsAppChat?: boolean; // Chats do WhatsApp são visíveis para todos os atendentes
  companyId?: string; // CRÍTICO: Isolamento por empresa
}

export interface WhatsAppMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
        }>;
      };
      field: string;
    }>;
  }>;
}


