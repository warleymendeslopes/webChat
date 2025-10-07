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
    console.log('🔍 GET /api/admin/ai-config - CompanyId:', companyId);
    console.log('📊 Config encontrada:', {
      exists: !!config,
      hasApiKey: !!(config as any)?.aiApiKey,
      apiKeyLength: (config as any)?.aiApiKey?.length,
    });

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
    console.log('✅ Retornando config com hasApiKey:', !!aiApiKey);
    console.log('📋 QnA existente:', (rest.qna || []).length, 'respostas');
    
    return NextResponse.json({
      ...rest,
      hasApiKey: !!aiApiKey,
      qna: rest.qna || [], // Garantir que sempre retorna o array de respostas
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

    console.log('📝 POST /api/admin/ai-config - Dados recebidos:', {
      companyId,
      hasContext: !!context,
      hasApiKey: !!aiApiKey,
      apiKeyLength: aiApiKey?.length,
      apiKeyType: typeof aiApiKey,
    });

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
      console.log('✅ Chave de API será salva no banco');
    } else {
      console.log('⚠️ Chave de API NÃO será salva (vazia ou inválida)');
    }

    console.log('📦 Objeto update que será salvo:', {
      ...update,
      aiApiKey: update.aiApiKey ? '***OCULTA***' : undefined,
    });

    const collection = await getCollection('aiConfigs');
    const result = await collection.updateOne(
      { companyId },
      { $set: update, $setOnInsert: { createdAt: new Date(), qna: [] } },
      { upsert: true }
    );

    console.log('💾 Resultado do MongoDB:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    });

    // Verificar se foi realmente salvo
    const saved = await collection.findOne({ companyId });
    console.log('🔍 Verificação após salvar:', {
      hasApiKey: !!(saved as any)?.aiApiKey,
      apiKeyLength: (saved as any)?.aiApiKey?.length,
    });

    return NextResponse.json({ success: true, upserted: result.upsertedCount > 0 });
  } catch (error: any) {
    console.error('Error saving AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

