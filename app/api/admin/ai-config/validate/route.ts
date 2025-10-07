import { getCollection } from '@/lib/mongodb';
import { AiConfig } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

// POST - valida chave e gera perguntas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, apiKey } = body as { companyId: string; apiKey: string };

    if (!companyId || !apiKey) {
      return NextResponse.json({ error: 'companyId and apiKey are required' }, { status: 400 });
    }

    // TODO: opcionalmente testar a chave chamando a API do provider (ping simples)
    if (typeof apiKey !== 'string' || apiKey.length < 20) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }

    const collection = await getCollection('aiConfigs');
    await collection.updateOne(
      { companyId },
      {
        $set: {
          status: 'validating',
          updatedAt: new Date(),
        } as Partial<AiConfig>,
        $setOnInsert: { createdAt: new Date(), qna: [] },
      },
      { upsert: true }
    );

    // Gera perguntas padrão (estáticas no MVP)
    const questions = [
      'Qual o horário de atendimento?',
      'Quais regiões vocês atendem?',
      'Principais produtos/serviços e diferenciais?',
      'Política de preços, descontos e formas de pagamento?',
      'Políticas de trocas/devoluções/garantias?',
      'Tom de voz e persona desejada?',
      'Metas de negócio (ex.: ticket médio, giro de estoque)?',
      'Ofertas e campanhas ativas?',
      'Processo de venda (etapas e gatilhos)?',
      'Limites de autonomia do AI e quando acionar humano?',
    ];

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error validating AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

