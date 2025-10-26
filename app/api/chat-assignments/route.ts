import { getAttendantAssignments, getChatAssignment, getUnassignedChats } from '@/lib/chatDistribution';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para buscar atribuições de chats
 * GET /api/chat-assignments?chatId=xxx - Buscar atribuição de um chat específico
 * GET /api/chat-assignments?attendantId=xxx&companyId=xxx - Buscar todos os chats de um atendente
 * GET /api/chat-assignments?companyId=xxx&unassigned=true - Buscar chats não atribuídos
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const attendantId = searchParams.get('attendantId');
    const companyId = searchParams.get('companyId');
    const unassigned = searchParams.get('unassigned') === 'true';

    // Buscar atribuição de um chat específico
    if (chatId) {
      const assignment = await getChatAssignment(chatId);
      
      if (!assignment) {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ assignment });
    }

    // Buscar chats não atribuídos
    if (unassigned && companyId) {
      const assignments = await getUnassignedChats(companyId);
      return NextResponse.json({ assignments });
    }

    // Buscar chats de um atendente
    if (attendantId && companyId) {
      const assignments = await getAttendantAssignments(attendantId, companyId);
      return NextResponse.json({ assignments });
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching chat assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

