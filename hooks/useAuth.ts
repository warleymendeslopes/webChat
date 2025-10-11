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
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser?.uid);
      setUser(firebaseUser);

      if (firebaseUser) {
        // Evitar múltiplas chamadas simultâneas
        if (isAuthenticating) {
          console.log('⏳ Already authenticating, skipping...');
          return;
        }
        
        setIsAuthenticating(true);
        console.log('🔐 Starting authentication...');
        try {
          // Authenticate user with MongoDB
          const authenticatedUser = await authService.authenticateUser(firebaseUser);
          
          if (authenticatedUser) {
            console.log('✅ User authenticated successfully');
            setAuthUser(authenticatedUser);
            setFirestoreUserId(authenticatedUser._id);
          } else {
            console.warn('⚠️ User not found in MongoDB or inactive');
            setAuthUser(null);
            setFirestoreUserId(null);
          }
        } catch (error) {
          console.error('❌ Authentication error:', error);
          setAuthUser(null);
          setFirestoreUserId(null);
        } finally {
          setIsAuthenticating(false);
        }
      } else {
        console.log('🚪 User logged out');
        setAuthUser(null);
        setFirestoreUserId(null);
        authService.logout();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Dependência vazia para evitar loops

  return { user, authUser, loading, firestoreUserId };
}


