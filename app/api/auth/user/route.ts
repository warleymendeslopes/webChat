import { getCollection } from '@/lib/mongodb';
import {
    getUserByEmail,
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
    let userData = await getUserByFirebaseAuthUid(firebaseAuthUid);
    
    // 🆕 Se usuário não existe, verificar se tem convite pendente
    if (!userData && email) {
      console.log(`🔍 User not found by firebaseAuthUid, checking for pending invite: ${email}`);
      
      // Verificar se existe convite pendente para este email
      const invitesCollection = await getCollection('pendingInvites');
      const pendingInvite = await invitesCollection.findOne({ 
        email: email.toLowerCase(),
        status: 'pending'
      });

      if (pendingInvite) {
        console.log(`✅ Found pending invite for ${email}, returning special response`);
        // Retornar resposta especial indicando que tem convite pendente
        return NextResponse.json({ 
          user: null,
          hasPendingInvite: true,
          inviteCompanyId: pendingInvite.companyId
        });
      }

      // 🆕 Se não tem convite, verificar se é o primeiro usuário (vai criar empresa)
      const usersCollection = await getCollection('users');
      const existingUsers = await usersCollection.countDocuments();

      console.log(`📊 Existing users count: ${existingUsers}`);

      // Se não tem nenhum usuário ainda, retornar null para que vá para onboarding
      if (existingUsers === 0) {
        console.log(`🎯 First user ever! Directing to onboarding...`);
        return NextResponse.json({ 
          user: null,
          isFirstUser: true
        });
      }

      // Se não é primeiro usuário e não tem convite, verificar se já existe por email
      const existingByEmail = await getUserByEmail(email);
      if (existingByEmail) {
        console.log(`🔄 User exists by email but missing firebaseAuthUid, updating...`);
        // Atualizar com o firebaseAuthUid
        const usersCol = await getCollection('users');
        await usersCol.updateOne(
          { email: email.toLowerCase() },
          { $set: { firebaseAuthUid } }
        );
        userData = await getUserByFirebaseAuthUid(firebaseAuthUid);
      }
    }
    
    if (!userData || !userData.isActive) {
      console.log(`❌ User not found or inactive for firebaseAuthUid: ${firebaseAuthUid}`);
      return NextResponse.json({ 
        user: null,
        error: 'User not found. Please contact your administrator or create your company.'
      }, { status: 200 }); // 200 ao invés de 404 para não quebrar o fluxo
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
