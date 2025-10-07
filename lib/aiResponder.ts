interface QnaItem { question: string; answer: string }

export async function generateSeniorSalesReply(params: {
  context: string;
  qna: QnaItem[];
  customerMessage: string;
  apiKey: string;
}): Promise<{ message: string; confidence: number; action: 'reply' | 'handoff_human' } | null> {
  const { context, qna, customerMessage, apiKey } = params;

  // Se não tiver API key, retorna null (não deve ter sido chamado)
  if (!apiKey || apiKey.trim().length === 0) {
    console.log('⚠️ Nenhuma API key fornecida - agente AI não pode ser ativado');
    return null;
  }

  // Monta o prompt com contexto e QnA
  let prompt = `Você é um assistente de vendas sênior altamente experiente e profissional. Seu objetivo é ajudar clientes com informações sobre produtos, serviços, preços e condições de pagamento de forma clara, objetiva e cordial.
  
  CONTEXTO DA EMPRESA:
  ${context || 'Não há contexto específico disponível.'}
  
  PERGUNTAS E RESPOSTAS FREQUENTES:
  ${qna && qna.length > 0 
  ? qna.map((item, i) => `${i + 1}. Pergunta: ${item.question}\n   Resposta: ${item.answer}`).join('\n\n')
  : 'Não há perguntas frequentes cadastradas.'}
  
  INSTRUÇÕES:
  1. Responda à mensagem do cliente de forma natural e profissional
  2. Use as informações do contexto e das perguntas frequentes quando relevante
  3. Seja cordial, mas direto ao ponto
  4. Mantenha respostas concisas (máximo 2-3 parágrafos)
  5. Incentive o próximo passo (enviar proposta, agendar atendimento, etc.)
  6. Use um tom de vendas consultivo e educado
  7. Não invente informações que não estão no contexto ou QnA
  
  MENSAGEM DO CLIENTE:
  ${customerMessage}
  
  Responda como um vendedor sênior responderia:`;

  console.log('🤖 Enviando requisição ao Gemini (v1 REST)...');

  // Timeout de 3 minutos (180000 ms)
  const TIMEOUT_MS = 180000;

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const timeoutErr = new Error('Gemini response timed out');
        (timeoutErr as any).name = 'GeminiTimeoutError';
        reject(timeoutErr);
      }, ms);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  // Chamada REST v1 do Gemini para evitar problemas de versão (v1beta 404)
  const MODEL = 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  } as any;

  const response = await withTimeout(fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }), TIMEOUT_MS);

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Gemini HTTP ${response.status}: ${errorText}`);
    (error as any).name = 'GeminiHttpError';
    (error as any).code = response.status;
    throw error;
  }

  const data = await response.json();
  const aiMessage = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  console.log('✅ Resposta recebida do Gemini:', {
    input: customerMessage,
    output: (aiMessage || '').substring(0, 150) + '...',
    outputLength: aiMessage?.length,
  });

  return {
    message: aiMessage,
    confidence: 0.85,
    action: 'reply',
  };
}
