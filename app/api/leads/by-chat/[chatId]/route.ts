import { getLeadByChatId } from '@/lib/leads';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para buscar lead pelo chatId
 * GET /api/leads/by-chat/[chatId]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    const lead = await getLeadByChatId(chatId);

    if (!lead) {
      return NextResponse.json(
        { lead: null, message: 'Lead not found' },
        { status: 200 } // 200 para não quebrar o fluxo
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead by chatId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

