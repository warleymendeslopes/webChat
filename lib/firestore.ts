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

// Chats
export async function createChat(participants: string[]) {
  const chatRef = await addDoc(collection(db, 'chats'), {
    participants,
    createdAt: serverTimestamp(),
    lastMessageTimestamp: serverTimestamp(),
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
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

export async function getOrCreateChat(participants: string[]) {
  const existingChat = await findChatByParticipants(participants);
  if (existingChat) {
    return existingChat.id;
  }
  return await createChat(participants);
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
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Chat;
    });
    callback(chats);
  });
}


