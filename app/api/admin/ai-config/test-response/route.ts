import { generateSeniorSalesReply } from '@/lib/aiResponder';
import { getAiConfig } from '@/lib/whatsappConfig';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/ai-config/test-response
 * 
 * Endpoint de teste para validar a resposta da IA do Gemini
 * 
 * Body:
 * {
 *   "companyId": "sua-empresa-id",
 *   "customerMessage": "Olá, quanto custa o produto?"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, customerMessage } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId é obrigatório' },
        { status: 400 }
      );
    }

    if (!customerMessage) {
      return NextResponse.json(
        { error: 'customerMessage é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🧪 Teste AI - Buscando configuração...', { companyId });

    // Busca a configuração de AI
    const aiConfig = await getAiConfig(companyId);

    if (!aiConfig) {
      return NextResponse.json(
        { 
          error: 'Configuração de AI não encontrada',
          hint: 'Configure a IA primeiro no painel admin'
        },
        { status: 404 }
      );
    }

    const apiKey = (aiConfig as any)?.aiApiKey || '';

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'API key não configurada',
          hint: 'Configure a chave da API do Gemini no painel admin',
          config: {
            hasContext: !!(aiConfig.context),
            qnaCount: aiConfig.qna?.length || 0,
            enabled: aiConfig.enabled,
            status: aiConfig.status,
          }
        },
        { status: 400 }
      );
    }

    console.log('🧪 Teste AI - Configuração encontrada:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length,
      hasContext: !!(aiConfig.context),
      contextLength: aiConfig.context?.length || 0,
      qnaCount: aiConfig.qna?.length || 0,
      enabled: aiConfig.enabled,
      status: aiConfig.status,
    });

    console.log('🧪 Teste AI - Chamando Gemini...');
    const startTime = Date.now();

    // Chama a função de AI
    const result = await generateSeniorSalesReply({
      context: aiConfig.context || '',
      qna: aiConfig.qna || [],
      customerMessage: customerMessage,
      apiKey: apiKey,
    });

    const duration = Date.now() - startTime;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini falhou ao gerar resposta',
          hint: 'Verifique se a API key está correta e válida',
          duration: `${duration}ms`,
        },
        { status: 500 }
      );
    }

    console.log('✅ Teste AI - Resposta gerada com sucesso');

    return NextResponse.json({
      success: true,
      test: {
        input: customerMessage,
        output: result.message,
        confidence: result.confidence,
        action: result.action,
        duration: `${duration}ms`,
      },
      config: {
        contextPreview: aiConfig.context?.substring(0, 100) + '...',
        qnaCount: aiConfig.qna?.length || 0,
        enabled: aiConfig.enabled,
        status: aiConfig.status,
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no teste AI:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro desconhecido',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
