import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// POST - alterna enabled (verifica requisitos mínimos)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, enabled } = body as { companyId: string; enabled: boolean };

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const collection = await getCollection('aiConfigs');
    const config = await collection.findOne({ companyId }) as any;

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // Se está tentando ativar, verificar requisitos mínimos
    if (enabled) {
      const hasApiKey = !!(config.aiApiKey);
      const hasContext = !!(config.context && config.context.trim().length > 0);
      
      console.log('🔍 Verificando requisitos para ativar AI:', {
        hasApiKey,
        hasContext,
        status: config.status,
      });

      if (!hasApiKey) {
        return NextResponse.json({ error: 'Chave de API não configurada. Configure a chave primeiro.' }, { status: 400 });
      }

      if (!hasContext) {
        return NextResponse.json({ error: 'Contexto não configurado. Preencha o contexto da empresa.' }, { status: 400 });
      }
    }

    await collection.updateOne(
      { companyId },
      { $set: { enabled: !!enabled, updatedAt: new Date() } }
    );

    console.log(`✅ AI ${enabled ? 'ativada' : 'desativada'} para companyId: ${companyId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

