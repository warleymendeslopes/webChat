import {
    getAllAttendantStatuses,
    getAttendantStatus,
    setAttendantAvailable,
    setAttendantAway,
    setAttendantBusy,
    setAttendantOffline,
    setMaxChats,
    updateAttendantActivity,
} from '@/lib/attendantStatus';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para gerenciar status de atendentes
 * GET /api/attendant/status?userId=xxx&companyId=xxx - Buscar status de um atendente
 * GET /api/attendant/status?companyId=xxx - Buscar todos os status da empresa
 * POST /api/attendant/status - Atualizar status do atendente
 * PUT /api/attendant/status/activity - Atualizar atividade (heartbeat)
 */

// Buscar status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (userId) {
      // Buscar status de um atendente específico
      const status = await getAttendantStatus(userId, companyId);
      
      if (!status) {
        return NextResponse.json(
          { error: 'Attendant status not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ status });
    } else {
      // Buscar todos os status da empresa
      const statuses = await getAllAttendantStatuses(companyId);
      return NextResponse.json({ statuses });
    }
  } catch (error) {
    console.error('Error fetching attendant status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Atualizar status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, companyId, status, maxChats } = body;

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: 'userId and companyId are required' },
        { status: 400 }
      );
    }

    // Atualizar maxChats se fornecido
    if (maxChats !== undefined && typeof maxChats === 'number') {
      await setMaxChats(userId, companyId, maxChats);
    }

    // Atualizar status se fornecido
    if (status) {
      switch (status) {
        case 'available':
          await setAttendantAvailable(userId, companyId);
          break;
        case 'busy':
          await setAttendantBusy(userId, companyId);
          break;
        case 'away':
          await setAttendantAway(userId, companyId);
          break;
        case 'offline':
          await setAttendantOffline(userId, companyId);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid status. Must be: available, busy, away, or offline' },
            { status: 400 }
          );
      }
    }

    const updatedStatus = await getAttendantStatus(userId, companyId);

    return NextResponse.json({
      success: true,
      status: updatedStatus,
      message: 'Attendant status updated successfully',
    });
  } catch (error) {
    console.error('Error updating attendant status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Atualizar atividade (heartbeat)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, companyId } = body;

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: 'userId and companyId are required' },
        { status: 400 }
      );
    }

    await updateAttendantActivity(userId, companyId);

    return NextResponse.json({
      success: true,
      message: 'Activity updated',
    });
  } catch (error) {
    console.error('Error updating attendant activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

