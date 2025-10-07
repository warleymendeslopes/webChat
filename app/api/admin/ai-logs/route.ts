import { listAiLogs } from '@/lib/aiLog';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limitParam = searchParams.get('limit');
    const limit = Math.max(1, Math.min(200, Number(limitParam) || 50));

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const logs = await listAiLogs(companyId, limit);
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching AI logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
