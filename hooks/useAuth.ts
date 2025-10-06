'use client';

import { auth } from '@/lib/firebase';
import { getOrCreateUserByAuthUid, updateUserStatusByAuthUid } from '@/lib/firestore';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firestoreUserId, setFirestoreUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Create or get Firestore user linked to this Firebase Auth user
        const userId = await getOrCreateUserByAuthUid(firebaseUser.uid, {
          name: firebaseUser.displayName || undefined,
          email: firebaseUser.email || undefined,
          phoneNumber: firebaseUser.phoneNumber || undefined,
        });
        setFirestoreUserId(userId);
        
        // Update user online status
        await updateUserStatusByAuthUid(firebaseUser.uid, true);

        // Set offline on window close
        window.addEventListener('beforeunload', () => {
          updateUserStatusByAuthUid(firebaseUser.uid, false);
        });
        
        setLoading(false);
      } else {
        setFirestoreUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, firestoreUserId };
}


