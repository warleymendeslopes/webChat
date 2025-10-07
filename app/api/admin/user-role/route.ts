import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// GET - Buscar role do usuário logado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseAuthUid = searchParams.get('uid');
    const email = searchParams.get('email');

    if (!firebaseAuthUid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 });
    }

    const usersCollection = await getCollection('appUsers');
    const user = await usersCollection.findOne({ firebaseAuthUid, isActive: true });

    if (user) {
      // Usuário já cadastrado
      return NextResponse.json({
        role: user.role,
        companyId: user.companyId,
        name: user.name,
        isFirstAccess: false,
      });
    }

    // Verificar se tem convite pendente (por email)
    if (email) {
      const invitesCollection = await getCollection('pendingInvites');
      const invite = await invitesCollection.findOne({ 
        email: email.toLowerCase(), 
        isActive: true 
      });

      if (invite) {
        // Tem convite pendente - retornar info do convite
        return NextResponse.json({
          role: null,
          isFirstAccess: true,
          hasPendingInvite: true,
          inviteCompanyId: invite.companyId,
          inviteName: invite.name,
        });
      }
    }

    // Usuário não cadastrado e sem convite
    return NextResponse.json({
      role: null,
      isFirstAccess: true,
      hasPendingInvite: false,
    });
  } catch (error: any) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar primeiro admin (primeiro acesso)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseAuthUid, email, name, companyName } = body;

    if (!firebaseAuthUid || !email || !name || !companyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const usersCollection = await getCollection('appUsers');
    
    // Verificar se já existe
    const existing = await usersCollection.findOne({ firebaseAuthUid });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Criar admin
    const user = {
      firebaseAuthUid,
      email,
      name,
      role: 'admin',
      companyId: firebaseAuthUid, // O primeiro admin usa seu UID como companyId
      createdAt: new Date(),
      isActive: true,
    };

    await usersCollection.insertOne(user);

    // Criar configuração inicial da empresa
    const configCollection = await getCollection('webChatConfigs');
    await configCollection.insertOne({
      companyId: firebaseAuthUid,
      companyName,
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
      whatsappVerifyToken: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      role: 'admin',
      companyId: firebaseAuthUid,
    });
  } catch (error: any) {
    console.error('Error creating first admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
