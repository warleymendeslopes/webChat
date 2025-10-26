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
    const days = parseInt(searchParams.get('days') || '30');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const stats = await getLeadStats(companyId, days);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

