import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// POST - Convidar atendente
export async function POST(request: NextRequest) {
  try {
    const { email, name, companyId } = await request.json();

    if (!email || !name || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const collection = await getCollection('pendingInvites');

    // Verificar se já existe convite pendente
    const existing = await collection.findOne({ email, companyId });
    if (existing) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 409 });
    }

    // Criar convite pendente
    await collection.insertOne({
      email: email.toLowerCase(),
      name,
      companyId,
      role: 'attendant',
      createdAt: new Date(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `Convite enviado para ${email}. Quando essa pessoa fizer login, será automaticamente adicionada como atendente.`,
    });
  } catch (error: any) {
    console.error('Error inviting attendant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Listar convites pendentes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const collection = await getCollection('pendingInvites');
    const invites = await collection
      .find({ companyId, isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ invites });
  } catch (error: any) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancelar convite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const companyId = searchParams.get('companyId');

    if (!email || !companyId) {
      return NextResponse.json({ error: 'Email and CompanyId required' }, { status: 400 });
    }

    const collection = await getCollection('pendingInvites');
    await collection.deleteOne({ email, companyId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
