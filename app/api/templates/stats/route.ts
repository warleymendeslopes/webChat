import { getTemplateStats } from '@/lib/templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Estatísticas de Templates
 * GET /api/templates/stats?companyId=xxx
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const stats = await getTemplateStats(companyId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
