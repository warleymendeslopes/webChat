'use client';

import { authService, AuthUser } from '@/lib/auth-service';
import { auth } from '@/lib/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';

export interface UserRoleData {
  role: 'admin' | 'attendant' | null;
  companyId: string | null;
  name: string | null;
  isFirstAccess: boolean;
  hasPendingInvite?: boolean;
  inviteCompanyId?: string;
  inviteName?: string;
}

export interface AuthState {
  user: FirebaseUser | null;
  authUser: AuthUser | null;
  firestoreUserId: string | null;
  roleData: UserRoleData;
  loading: boolean;
  isAuthenticating: boolean;
}

export function useAuthState() {
  const [state, setState] = useState<AuthState>({
    user: null,
    authUser: null,
    firestoreUserId: null,
    roleData: {
      role: null,
      companyId: null,
      name: null,
      isFirstAccess: false,
    },
    loading: true,
    isAuthenticating: false,
  });

  const lastUserId = useRef<string | null>(null);
  const isFetchingRole = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser?.uid);
      
      // Se não há usuário, limpar tudo
      if (!firebaseUser) {
        console.log('🚪 No user, clearing all data');
        setState({
          user: null,
          authUser: null,
          firestoreUserId: null,
          roleData: {
            role: null,
            companyId: null,
            name: null,
            isFirstAccess: false,
          },
          loading: false,
          isAuthenticating: false,
        });
        lastUserId.current = null;
        isFetchingRole.current = false;
        hasInitialized.current = false;
        return;
      }

      // Evitar processamento duplicado do mesmo usuário
      if (lastUserId.current === firebaseUser.uid && hasInitialized.current) {
        console.log('⏭️ Same user already processed, skipping...');
        return;
      }

      lastUserId.current = firebaseUser.uid;
      hasInitialized.current = true;

      setState(prev => ({ ...prev, loading: true, user: firebaseUser }));

      // Autenticar usuário com MongoDB
      setState(prev => ({ ...prev, isAuthenticating: true }));
      
      try {
        console.log('🔐 Starting authentication...');
        const authenticatedUser = await authService.authenticateUser(firebaseUser);
        
        if (authenticatedUser) {
          console.log('✅ User authenticated successfully');
          setState(prev => ({
            ...prev,
            authUser: authenticatedUser,
            firestoreUserId: authenticatedUser._id,
          }));
        } else {
          console.warn('⚠️ User not found in MongoDB or inactive');
          setState(prev => ({
            ...prev,
            authUser: null,
            firestoreUserId: null,
          }));
        }
      } catch (error) {
        console.error('❌ Authentication error:', error);
        setState(prev => ({
          ...prev,
          authUser: null,
          firestoreUserId: null,
        }));
      } finally {
        setState(prev => ({ ...prev, isAuthenticating: false }));
      }

      // Buscar role do usuário em paralelo
      const fetchRole = async () => {
        if (isFetchingRole.current) return;
        isFetchingRole.current = true;
        
        try {
          console.log('🔍 Fetching user role...');
          const email = firebaseUser.email || '';
          const response = await fetch(`/api/admin/user-role?uid=${firebaseUser.uid}&email=${encodeURIComponent(email)}`);
          const data = await response.json();
          console.log('✅ Role fetched successfully:', data);

          setState(prev => ({
            ...prev,
            roleData: {
              role: data.role,
              companyId: data.companyId || null,
              name: data.name || null,
              isFirstAccess: data.isFirstAccess || false,
              hasPendingInvite: data.hasPendingInvite || false,
              inviteCompanyId: data.inviteCompanyId,
              inviteName: data.inviteName,
            },
            loading: false,
          }));
        } catch (error) {
          console.error('❌ Error fetching user role:', error);
          setState(prev => ({
            ...prev,
            roleData: {
              role: null,
              companyId: null,
              name: null,
              isFirstAccess: false,
            },
            loading: false,
          }));
        } finally {
          isFetchingRole.current = false;
        }
      };

      // Executar busca de role em paralelo
      fetchRole();
    });

    return () => unsubscribe();
  }, []); // Dependência vazia para evitar loops

  return state;
}
