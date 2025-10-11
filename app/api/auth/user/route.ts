import {
    getUserByFirebaseAuthUid
} from '@/lib/mongodb-users';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { firebaseAuthUid, email, name } = await request.json();

    if (!firebaseAuthUid) {
      return NextResponse.json({ error: 'Firebase Auth UID required' }, { status: 400 });
    }

    // Get user data from MongoDB
    const userData = await getUserByFirebaseAuthUid(firebaseAuthUid);
    
    if (!userData || !userData.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }

    // Get user permissions
    const permissions = {
      admin: {
        canManageUsers: true,
        canViewReports: true,
        canManageWhatsApp: true,
        canManageAI: true,
        canViewAllChats: true,
        canManageCompany: true,
      },
      attendant: {
        canManageUsers: false,
        canViewReports: false,
        canManageWhatsApp: false,
        canManageAI: false,
        canViewAllChats: true,
        canManageCompany: false,
      },
    };

    const userPermissions = permissions[userData.role] || permissions.attendant;

    const authUser = {
      ...userData,
      permissions: userPermissions,
    };

    return NextResponse.json({ user: authUser });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
