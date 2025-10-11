import { Chat, Message, User } from '@/types';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  limit as fbLimit,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';

// Users
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastSeen'>) {
  const userRef = await addDoc(collection(db, 'users'), {
    ...userData,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
  return userRef.id;
}

export async function getUserByPhoneNumber(phoneNumber: string) {
  const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const userDoc = querySnapshot.docs[0];
  return {
    id: userDoc.id,
    ...userDoc.data(),
  } as User;
}

export async function updateUserStatus(userId: string, isOnline: boolean) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isOnline,
    lastSeen: serverTimestamp(),
  });
}

export async function updateUserStatusByAuthUid(firebaseAuthUid: string, isOnline: boolean) {
  const q = query(collection(db, 'users'), where('firebaseAuthUid', '==', firebaseAuthUid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userRef = doc(db, 'users', querySnapshot.docs[0].id);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  }
}

// Chats
export async function createChat(participants: string[], isWhatsAppChat: boolean = false, companyId?: string) {
  const chatRef = await addDoc(collection(db, 'chats'), {
    participants,
    createdAt: serverTimestamp(),
    lastMessageTimestamp: serverTimestamp(),
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
    isWhatsAppChat,
    companyId, // CRÍTICO: Isolamento por empresa
  });
  return chatRef.id;
}

export async function findChatByParticipants(participants: string[]) {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', participants[0])
  );
  const querySnapshot = await getDocs(q);
  
  for (const doc of querySnapshot.docs) {
    const chat = doc.data();
    if (
      chat.participants.length === participants.length &&
      participants.every((p: string) => chat.participants.includes(p))
    ) {
      return {
        id: doc.id,
        ...chat,
      } as Chat;
    }
  }
  
  return null;
}

export async function getOrCreateChat(participants: string[], isWhatsAppChat: boolean = false, companyId?: string) {
  const existingChat = await findChatByParticipants(participants);
  if (existingChat) {
    return existingChat.id;
  }
  return await createChat(participants, isWhatsAppChat, companyId);
}

// Increment unread for a recipient when a new message arrives
export async function incrementUnread(chatId: string, recipientUserId: string) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`unreadCount.${recipientUserId}`]: increment(1),
  });
}

// Clear unread for a user when they open a chat
export async function clearUnread(chatId: string, userId: string) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`unreadCount.${userId}`]: 0,
  });
}

// Messages
export async function sendMessage(messageData: Omit<Message, 'id' | 'timestamp'>) {
  // Remove undefined fields (Firestore doesn't accept them)
  const cleanData: any = {
    chatId: messageData.chatId,
    senderId: messageData.senderId,
    status: messageData.status,
    isFromWhatsApp: messageData.isFromWhatsApp,
    timestamp: serverTimestamp(),
  };

  // Only add optional fields if they have values
  if (messageData.text) cleanData.text = messageData.text;
  if (messageData.mediaUrl) cleanData.mediaUrl = messageData.mediaUrl;
  if (messageData.mediaType) cleanData.mediaType = messageData.mediaType;
  if (messageData.whatsappMessageId) cleanData.whatsappMessageId = messageData.whatsappMessageId;

  const messageRef = await addDoc(collection(db, 'messages'), cleanData);

  // Update chat's last message
  const chatRef = doc(db, 'chats', messageData.chatId);
  const lastMessagePayload: any = {
    senderId: messageData.senderId,
    timestamp: serverTimestamp(),
  };
  if (messageData.text) lastMessagePayload.text = messageData.text;
  if (messageData.mediaUrl) lastMessagePayload.mediaUrl = messageData.mediaUrl;
  if (messageData.mediaType) lastMessagePayload.mediaType = messageData.mediaType;

  // Build unread increments for all participants except the sender
  // We cannot read participants here without another read, so we rely on webhook/senders to also update.
  // However, we can safely increment using dynamic fields if caller provides recipients.
  await updateDoc(chatRef, {
    lastMessageTimestamp: serverTimestamp(),
    lastMessage: lastMessagePayload,
  });

  return messageRef.id;
}

export async function updateMessageStatus(messageId: string, status: Message['status']) {
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, { status });
}

export function subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as Message;
    });
    callback(messages);
  });
}

export async function getMessagesSince(chatId: string, since: Date, max: number = 30): Promise<Message[]> {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    where('timestamp', '>=', Timestamp.fromDate(since)),
    orderBy('timestamp', 'asc'),
    fbLimit(max)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data: any = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    } as Message;
  });
}

export function subscribeToChats(userId: string, companyId: string, callback: (chats: Chat[]) => void) {
  // Query 1: Chats onde o usuário é participante (privados)
  const privateChatsQuery = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  // Query 2: Chats do WhatsApp (FILTRADOS POR EMPRESA)
  const whatsappChatsQuery = query(
    collection(db, 'chats'),
    where('isWhatsAppChat', '==', true),
    where('companyId', '==', companyId) // CRÍTICO: Isolamento por empresa
  );

  // Combine results from both queries
  const unsubscribe1 = onSnapshot(privateChatsQuery, () => {
    updateCombinedChats();
  });

  const unsubscribe2 = onSnapshot(whatsappChatsQuery, () => {
    updateCombinedChats();
  });

  async function updateCombinedChats() {
    const [privateSnapshot, whatsappSnapshot] = await Promise.all([
      getDocs(privateChatsQuery),
      getDocs(whatsappChatsQuery)
    ]);

    // Combine and deduplicate chats
    const chatMap = new Map<string, Chat>();

    // Add private chats
    privateSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      chatMap.set(doc.id, {
        id: doc.id,
        ...data,
        lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Chat);
    });

    // Add WhatsApp chats (will overwrite if same ID)
    whatsappSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      chatMap.set(doc.id, {
        id: doc.id,
        ...data,
        lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Chat);
    });

    // Sort by last message timestamp
    const chats = Array.from(chatMap.values()).sort(
      (a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()
    );

    callback(chats);
  }

  // Initial load
  updateCombinedChats();

  // Return combined unsubscribe function
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
}

// Get or create attendant user (for WhatsApp integration)
export async function getOrCreateAttendant(firebaseAuthUid?: string) {
  // Try to get from environment variable first
  const attendantAuthUid = firebaseAuthUid || process.env.NEXT_PUBLIC_ATTENDANT_AUTH_UID;
  
  if (attendantAuthUid) {
    // Check if user exists with this Firebase Auth UID
    const q = query(collection(db, 'users'), where('firebaseAuthUid', '==', attendantAuthUid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
  }
  
  // Fallback: look for a user with phoneNumber matching attendant
  const attendantPhone = process.env.NEXT_PUBLIC_ATTENDANT_PHONE;
  if (attendantPhone) {
    const user = await getUserByPhoneNumber(attendantPhone);
    if (user) {
      return user.id;
    }
  }
  
  // Fallback: get the first user in the system (usually the logged in user)
  const usersQuery = query(collection(db, 'users'), where('firebaseAuthUid', '!=', null));
  const usersSnapshot = await getDocs(usersQuery);
  
  if (!usersSnapshot.empty) {
    return usersSnapshot.docs[0].id;
  }
  
  // Last resort: return 'system' (for backward compatibility)
  return 'system';
}

// Link Firebase Auth UID to Firestore user
export async function linkFirebaseAuthToUser(firestoreUserId: string, firebaseAuthUid: string) {
  const userRef = doc(db, 'users', firestoreUserId);
  await updateDoc(userRef, {
    firebaseAuthUid,
  });
}


// Get user by ID - OPTIMIZED
export async function getUserById(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    return {
      id: userSnap.id,
      ...userSnap.data(),
    } as User;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Normalize Brazilian phone number (add missing digit 9 for mobile)
function normalizeBrazilianPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Brazilian mobile format: 55 (country) + 2 (area) + 9 (mobile) + 8 (number)
  // Total: 13 digits
  
  // If it's 12 digits and starts with 55, it's missing the 9
  if (digits.length === 12 && digits.startsWith('55')) {
    const countryCode = digits.substring(0, 2); // 55
    const areaCode = digits.substring(2, 4); // 31, 11, etc
    const number = digits.substring(4); // rest
    
    // Add the missing 9 after area code
    return `${countryCode}${areaCode}9${number}`;
  }
  
  // Already correct or not Brazilian
  return digits;
}

// Get chat recipient phone number (for WhatsApp chats) - OPTIMIZED
export async function getChatRecipientPhone(chatId: string, currentUserId: string): Promise<string> {
  try {
    // Get chat
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      return '';
    }
    
    const chatData = chatSnap.data();
    const participants = chatData.participants as string[];
    
    // Find the participant that is NOT the current user
    const recipientId = participants.find(id => id !== currentUserId);
    
    if (!recipientId) {
      return '';
    }
    
    // Get recipient user data
    const recipientRef = doc(db, 'users', recipientId);
    const recipientSnap = await getDoc(recipientRef);
    
    if (!recipientSnap.exists()) {
      return '';
    }
    
    const recipientData = recipientSnap.data();
    const rawPhone = recipientData.phoneNumber || '';
    
    // Normalize Brazilian phone numbers
    return normalizeBrazilianPhone(rawPhone);
  } catch (error) {
    console.error('Error getting chat recipient phone:', error);
    return '';
  }
}

export function subscribeToChat(chatId: string, callback: (chat: Chat | null) => void) {
  const q = query(collection(db, 'chats'), where('__name__', '==', chatId));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    const docSnap = snapshot.docs[0];
    const data: any = docSnap.data();
    const chat: Chat = {
      id: docSnap.id,
      ...data,
      lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Chat;
    callback(chat);
  });
}

export async function setChatAiControl(chatId: string, inControl: boolean) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, { aiControl: inControl });
}


