import { getCollection } from '@/lib/mongodb';
import { WebChatConfig } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET - Buscar configuração da empresa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId required' }, { status: 400 });
    }

    const collection = await getCollection('webChatConfigs');
    const config = await collection.findOne({ companyId, isActive: true });

    if (!config) {
      return NextResponse.json({
        companyName: '',
        whatsappPhoneNumberId: '',
        whatsappAccessToken: '',
        whatsappVerifyToken: '',
      });
    }

    // Retornar valores para autopreencher o formulário
    return NextResponse.json({
      companyName: config.companyName || '',
      whatsappPhoneNumberId: config.whatsappPhoneNumberId || '',
      whatsappAccessToken: config.whatsappAccessToken || '',
      whatsappVerifyToken: config.whatsappVerifyToken || '',
    });
  } catch (error: any) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar/Atualizar configuração
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, companyName, whatsappPhoneNumberId, whatsappAccessToken, whatsappVerifyToken } = body;

    if (!companyId || !companyName || !whatsappPhoneNumberId || !whatsappAccessToken || !whatsappVerifyToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await getCollection('webChatConfigs');

    const config: Partial<WebChatConfig> = {
      companyId,
      companyName,
      whatsappPhoneNumberId,
      whatsappAccessToken,
      whatsappVerifyToken,
      updatedAt: new Date(),
      isActive: true,
    };

    // Upsert: atualiza se existe, cria se não existe
    const result = await collection.updateOne(
      { companyId },
      {
        $set: config,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: result.upsertedCount > 0 ? 'Configuration created' : 'Configuration updated',
    });
  } catch (error: any) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
