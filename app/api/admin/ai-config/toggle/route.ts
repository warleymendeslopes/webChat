import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// POST - alterna enabled (somente se status === 'active')
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, enabled } = body as { companyId: string; enabled: boolean };

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const collection = await getCollection('aiConfigs');
    const config = await collection.findOne({ companyId });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    if (config.status !== 'active' && enabled) {
      return NextResponse.json({ error: 'Config not active' }, { status: 400 });
    }

    await collection.updateOne(
      { companyId },
      { $set: { enabled: !!enabled, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

