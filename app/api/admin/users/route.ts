import { authService } from '@/lib/auth-service';
import {
  createUser,
  getUserById,
  getUsersByCompany,
  updateUser
} from '@/lib/mongodb-users';
import { AppUser } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET - Listar usuários da empresa
export async function GET(request: NextRequest) {
  try {
    // Validate admin permissions
    const authUser = await authService.validateRequest(request);
    if (!authUser || !authUser.permissions.canManageUsers) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || authUser.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const users = await getUsersByCompany(companyId);
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar novo usuário/atendente
export async function POST(request: NextRequest) {
  try {
    // Validate admin permissions
    const authUser = await authService.validateRequest(request);
    if (!authUser || !authUser.permissions.canManageUsers) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firebaseAuthUid, email, name, role, companyId } = body;

    if (!firebaseAuthUid || !email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'attendant') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const userCompanyId = companyId || authUser.companyId;
    if (!userCompanyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const userData: Omit<AppUser, '_id'> = {
      firebaseAuthUid,
      email,
      name,
      role,
      companyId: userCompanyId,
      createdAt: new Date(),
      isActive: true,
    };

    const userId = await createUser(userData);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Desativar usuário
export async function DELETE(request: NextRequest) {
  try {
    // Validate admin permissions
    const authUser = await authService.validateRequest(request);
    if (!authUser || !authUser.permissions.canManageUsers) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    // Check if user exists and belongs to same company
    const user = await getUserById(userId);
    if (!user || user.companyId !== authUser.companyId) {
      return NextResponse.json({ error: 'User not found or unauthorized' }, { status: 404 });
    }

    await updateUser(userId, { isActive: false });

    return NextResponse.json({ 
      success: true,
      message: 'User deactivated successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
