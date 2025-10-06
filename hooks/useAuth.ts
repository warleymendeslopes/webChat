'use client';

import { auth } from '@/lib/firebase';
import { updateUserStatus } from '@/lib/firestore';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Update user online status
        await updateUserStatus(firebaseUser.uid, true);

        // Set offline on window close
        window.addEventListener('beforeunload', () => {
          updateUserStatus(firebaseUser.uid, false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}


