import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, companyId } = await request.json();

    let effectiveKey = apiKey as string | undefined;

    if (!effectiveKey && companyId) {
      const collection = await getCollection('aiConfigs');
      const cfg = await collection.findOne({ companyId });
      effectiveKey = (cfg as any)?.aiApiKey;
    }

    if (!effectiveKey || typeof effectiveKey !== 'string') {
      return NextResponse.json({ ok: false, error: 'apiKey not provided or not found' }, { status: 400 });
    }

    // MVP: validação simples de formato/tamanho
    const plausible = /^(AIza|AIza)[A-Za-z0-9_\-]{20,}$/.test(effectiveKey) || effectiveKey.length >= 20;
    if (!plausible) {
      return NextResponse.json({ ok: false, error: 'Invalid API key format' }, { status: 400 });
    }

    // Futuro: chamada real ao Gemini
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
