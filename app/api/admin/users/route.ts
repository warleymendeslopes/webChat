import { getCollection } from '@/lib/mongodb';
import { AppUser } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET - Listar usuários da empresa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const collection = await getCollection('appUsers');
    const users = await collection
      .find({ companyId, isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar novo usuário/atendente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseAuthUid, email, name, role, companyId } = body;

    if (!firebaseAuthUid || !email || !name || !role || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'attendant') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const collection = await getCollection('appUsers');

    // Verificar se usuário já existe
    const existing = await collection.findOne({ firebaseAuthUid });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const user: Omit<AppUser, '_id'> = {
      firebaseAuthUid,
      email,
      name,
      role,
      companyId,
      createdAt: new Date(),
      isActive: true,
    } as Omit<AppUser, '_id'>;

    // Cast to any to satisfy Mongo's OptionalId<Document> typing
    await collection.insertOne(user as any);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Desativar usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    const collection = await getCollection('appUsers');
    await collection.updateOne(
      { firebaseAuthUid: userId },
      { $set: { isActive: false } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
