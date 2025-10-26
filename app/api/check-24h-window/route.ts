import { isWithin24HourWindow } from '@/lib/chatDistribution';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para verificar se um chat está dentro da janela de 24h
 * GET /api/check-24h-window?chatId=xxx
 * POST /api/check-24h-window { chatId: string }
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const isValid = await isWithin24HourWindow(chatId);

    return NextResponse.json({
      chatId,
      isValid,
      expired: !isValid,
      message: isValid
        ? 'Chat está dentro da janela de 24h'
        : 'Janela de 24h expirada - aguarde mensagem do cliente',
    });
  } catch (error) {
    console.error('Error checking 24h window:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const isValid = await isWithin24HourWindow(chatId);

    return NextResponse.json({
      chatId,
      isValid,
      expired: !isValid,
      message: isValid
        ? 'Chat está dentro da janela de 24h'
        : 'Janela de 24h expirada - aguarde mensagem do cliente',
    });
  } catch (error) {
    console.error('Error checking 24h window:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

