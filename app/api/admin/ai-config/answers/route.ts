import { getCollection } from '@/lib/mongodb';
import { AiConfig, AiQnaItem } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

// POST - salva respostas e ativa se consistente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, answers } = body as { companyId: string; answers: AiQnaItem[] };

    if (!companyId || !Array.isArray(answers) || answers.length < 5) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const collection = await getCollection('aiConfigs');
    const config = await collection.findOne({ companyId });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // Validação aprimorada e mais tolerante
    // - Pelo menos 8 respostas com 10+ caracteres
    // - Cobrir ao menos 3 dos 5 tópicos essenciais
    const normalize = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

    const normalizedAnswers = answers.map(a => normalize(a.answer));
    const nonEmptyCount = normalizedAnswers.filter(a => a && a.replace(/\s+/g, ' ').trim().length >= 10).length;

    const joined = normalizedAnswers.join(' ');
    const topics = {
      horario: /(horario|horário|funcionamento|abertura|fechamento)/,
      pagamento: /(pagamento|pix|cartao|cartão|boleto|parcel|preco|preço|desconto)/,
      trocas: /(troca|devolucao|devolução|garantia|reembolso|politica)/,
      tom: /(tom|voz|persona|estilo|linguagem|formal|informal)/,
      limites: /(limite|autonomia|aprovar|acessar|humano|handoff)/,
    } as const;

    const coverage: Record<string, boolean> = {
      horario: topics.horario.test(joined),
      pagamento: topics.pagamento.test(joined),
      trocas: topics.trocas.test(joined),
      tom: topics.tom.test(joined),
      limites: topics.limites.test(joined),
    };

    const coveredCount = Object.values(coverage).filter(Boolean).length;
    const missingTopics = Object.entries(coverage)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    const ok = nonEmptyCount >= 8 && coveredCount >= 3;

    const update: Partial<AiConfig> = {
      qna: answers,
      status: ok ? 'active' : 'error',
      enabled: ok,
      lastValidationAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.updateOne({ companyId }, { $set: update });

    return NextResponse.json({
      success: ok,
      status: update.status,
      details: {
        nonEmptyAnswers: nonEmptyCount,
        coveredTopics: coveredCount,
        missingTopics,
      },
    });
  } catch (error: any) {
    console.error('Error saving AI answers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

