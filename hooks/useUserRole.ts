'use client';

import { User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';

export interface UserRoleData {
  role: 'admin' | 'attendant' | null;
  companyId: string | null;
  name: string | null;
  isFirstAccess: boolean;
  hasPendingInvite?: boolean;
  inviteCompanyId?: string;
  inviteName?: string;
  loading: boolean;
}

export function useUserRole(user: FirebaseUser | null) {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    companyId: null,
    name: null,
    isFirstAccess: false,
    loading: true,
  });
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('🚪 No user, clearing role data');
      setRoleData({
        role: null,
        companyId: null,
        name: null,
        isFirstAccess: false,
        loading: false,
      });
      setLastUserId(null);
      return;
    }

    // Evitar chamadas desnecessárias se o usuário não mudou
    if (lastUserId === user.uid) {
      console.log('⏭️ Same user, skipping role fetch');
      return;
    }

    // Evitar chamadas se já está carregando ou fazendo fetch
    if (roleData.loading || isFetching) {
      console.log('⏳ Already loading or fetching, skipping...');
      return;
    }

    console.log('🔄 New user detected, fetching role...');
    setLastUserId(user.uid);
    setIsFetching(true);
    setRoleData(prev => ({ ...prev, loading: true }));

    async function fetchRole() {
      try {
        console.log('🔍 useUserRole: Fetching role for user:', user!.uid);
        const email = user!.email || '';
        const response = await fetch(`/api/admin/user-role?uid=${user!.uid}&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        console.log('✅ useUserRole: Role fetched successfully:', data);

        setRoleData({
          role: data.role,
          companyId: data.companyId || null,
          name: data.name || null,
          isFirstAccess: data.isFirstAccess || false,
          hasPendingInvite: data.hasPendingInvite || false,
          inviteCompanyId: data.inviteCompanyId,
          inviteName: data.inviteName,
          loading: false,
        });
      } catch (error) {
        console.error('❌ Error fetching user role:', error);
        setRoleData(prev => ({ ...prev, loading: false }));
      } finally {
        setIsFetching(false);
      }
    }

    fetchRole();
  }, [user]); // Apenas user como dependência

  return roleData;
}
