'use client';

import { authService, AuthUser } from '@/lib/auth-service';
import { auth } from '@/lib/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [firestoreUserId, setFirestoreUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Authenticate user with MongoDB
          const authenticatedUser = await authService.authenticateUser(firebaseUser);
          
          if (authenticatedUser) {
            setAuthUser(authenticatedUser);
            setFirestoreUserId(authenticatedUser._id);
          } else {
            console.warn('User not found in MongoDB or inactive');
            setAuthUser(null);
            setFirestoreUserId(null);
          }
        } catch (error) {
          console.error('Authentication error:', error);
          setAuthUser(null);
          setFirestoreUserId(null);
        }
      } else {
        setAuthUser(null);
        setFirestoreUserId(null);
        authService.logout();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, authUser, loading, firestoreUserId };
}


