import { Chat, Message, User } from '@/types';
import {
  addDoc,
  collection,
  doc,
  getDocs,
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
export async function createChat(participants: string[], isWhatsAppChat: boolean = false) {
  const chatRef = await addDoc(collection(db, 'chats'), {
    participants,
    createdAt: serverTimestamp(),
    lastMessageTimestamp: serverTimestamp(),
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
    isWhatsAppChat,
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

export async function getOrCreateChat(participants: string[], isWhatsAppChat: boolean = false) {
  const existingChat = await findChatByParticipants(participants);
  if (existingChat) {
    return existingChat.id;
  }
  return await createChat(participants, isWhatsAppChat);
}

// Messages
export async function sendMessage(messageData: Omit<Message, 'id' | 'timestamp'>) {
  const messageRef = await addDoc(collection(db, 'messages'), {
    ...messageData,
    timestamp: serverTimestamp(),
  });

  // Update chat's last message
  const chatRef = doc(db, 'chats', messageData.chatId);
  await updateDoc(chatRef, {
    lastMessageTimestamp: serverTimestamp(),
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

export function subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
  // Query 1: Chats onde o usuário é participante (privados)
  const privateChatsQuery = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  // Query 2: Chats do WhatsApp (públicos para todos atendentes)
  const whatsappChatsQuery = query(
    collection(db, 'chats'),
    where('isWhatsAppChat', '==', true)
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
    console.log(`Using first available user as attendant: ${usersSnapshot.docs[0].id}`);
    return usersSnapshot.docs[0].id;
  }
  
  // Last resort: return 'system' (for backward compatibility)
  console.warn('No attendant user found, using "system" as fallback');
  return 'system';
}

// Link Firebase Auth UID to Firestore user
export async function linkFirebaseAuthToUser(firestoreUserId: string, firebaseAuthUid: string) {
  const userRef = doc(db, 'users', firestoreUserId);
  await updateDoc(userRef, {
    firebaseAuthUid,
  });
}

// Get or create user by Firebase Auth UID (for logged in users)
export async function getOrCreateUserByAuthUid(
  firebaseAuthUid: string,
  userData: { name?: string; email?: string; phoneNumber?: string }
) {
  const q = query(collection(db, 'users'), where('firebaseAuthUid', '==', firebaseAuthUid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
  
  // Create new user
  const userRef = await addDoc(collection(db, 'users'), {
    firebaseAuthUid,
    name: userData.name || userData.email || 'Atendente',
    phoneNumber: userData.phoneNumber || '',
    email: userData.email || '',
    isOnline: true,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
  
  return userRef.id;
}


