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

  useEffect(() => {
    if (!user) {
      setRoleData({
        role: null,
        companyId: null,
        name: null,
        isFirstAccess: false,
        loading: false,
      });
      return;
    }

    async function fetchRole() {
      try {
        const email = user!.email || '';
        const response = await fetch(`/api/admin/user-role?uid=${user!.uid}&email=${encodeURIComponent(email)}`);
        const data = await response.json();

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
        console.error('Error fetching user role:', error);
        setRoleData(prev => ({ ...prev, loading: false }));
      }
    }

    fetchRole();
  }, [user]);

  return roleData;
}
