import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// POST - Aceitar convite e criar usuário atendente
export async function POST(request: NextRequest) {
  try {
    const { firebaseAuthUid, email, name } = await request.json();

    if (!firebaseAuthUid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const invitesCollection = await getCollection('pendingInvites');
    const invite = await invitesCollection.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });

    if (!invite) {
      return NextResponse.json({ error: 'No pending invite found' }, { status: 404 });
    }

    const usersCollection = await getCollection('appUsers');

    // Verificar se usuário já existe
    const existing = await usersCollection.findOne({ firebaseAuthUid });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Criar usuário atendente
    await usersCollection.insertOne({
      firebaseAuthUid,
      email: email.toLowerCase(),
      name: name || invite.name,
      role: 'attendant',
      companyId: invite.companyId,
      createdAt: new Date(),
      isActive: true,
    });

    // Remover convite pendente
    await invitesCollection.deleteOne({ _id: invite._id });

    return NextResponse.json({
      success: true,
      role: 'attendant',
      companyId: invite.companyId,
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
