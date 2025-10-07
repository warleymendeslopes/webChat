import { getCollection } from '@/lib/mongodb';
import { AiConfig } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET - retorna configuração de AI por companyId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const collection = await getCollection('aiConfigs');
    const config = await collection.findOne({ companyId });

    if (!config) {
      return NextResponse.json({
        companyId,
        provider: 'gemini',
        context: '',
        apiKeyRef: '',
        enabled: false,
        status: 'draft',
        confidenceThreshold: 0.75,
        handoffRules: { keywords: [], intents: [], businessHoursOnly: false },
        maxConcurrentChats: 3,
        qna: [],
        hasApiKey: false,
      } as Partial<AiConfig> & { hasApiKey: boolean });
    }

    const { aiApiKey, ...rest } = config as any;
    return NextResponse.json({
      ...rest,
      hasApiKey: !!aiApiKey,
    });
  } catch (error: any) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - cria/atualiza rascunho de configuração (sem ativar)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, context, apiKeyRef, confidenceThreshold, handoffRules, maxConcurrentChats, aiApiKey } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const update: Partial<AiConfig> & { aiApiKey?: string } = {
      companyId,
      provider: 'gemini',
      context: context ?? '',
      apiKeyRef: apiKeyRef ?? '',
      confidenceThreshold: typeof confidenceThreshold === 'number' ? confidenceThreshold : 0.75,
      handoffRules: handoffRules ?? { keywords: [], intents: [], businessHoursOnly: false },
      maxConcurrentChats: typeof maxConcurrentChats === 'number' ? maxConcurrentChats : 3,
      updatedAt: new Date(),
      status: 'draft',
      enabled: false,
    } as any;

    if (typeof aiApiKey === 'string' && aiApiKey.length > 0) {
      (update as any).aiApiKey = aiApiKey; // NOTE: consider encrypting at rest in production
    }

    const collection = await getCollection('aiConfigs');
    const result = await collection.updateOne(
      { companyId },
      { $set: update, $setOnInsert: { createdAt: new Date(), qna: [] } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, upserted: result.upsertedCount > 0 });
  } catch (error: any) {
    console.error('Error saving AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

