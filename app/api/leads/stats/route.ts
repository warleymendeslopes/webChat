import { getLeadStats } from '@/lib/leads';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Estatísticas de Leads
 * GET /api/leads/stats?companyId=xxx&days=30
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const userRole = searchParams.get('userRole'); // 'admin' ou 'attendant'
    const userId = searchParams.get('userId'); // ID do usuário logado
    const days = parseInt(searchParams.get('days') || '30');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // 🆕 Se for attendant, filtrar estatísticas apenas para seus leads
    const attendantId = userRole === 'attendant' && userId ? userId : undefined;
    const stats = await getLeadStats(companyId, days, attendantId);

    return NextResponse.json({
      success: true,
      stats,
      userRole, // Retornar role para o frontend
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

