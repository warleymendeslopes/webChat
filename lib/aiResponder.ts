interface QnaItem { question: string; answer: string }

export function generateSeniorSalesReply(params: {
  context: string;
  qna: QnaItem[];
  customerMessage: string;
}): { message: string; confidence: number; action: 'reply' | 'handoff_human' } {
  const { context, qna, customerMessage } = params;
  const msg = (customerMessage || '').toLowerCase();

  const isGreeting = /\b(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hello|hi)\b/.test(msg);
  const wantsPrice = /(pre[cç]o|quanto|valor|custa|tabela)/.test(msg);
  const wantsPayment = /(pagamento|pix|cart[aã]o|boleto|parcel)/.test(msg);
  const wantsHours = /(hor[aá]rio|funcionamento|abertura|fechamento)/.test(msg);

  const lines: string[] = [];
  if (isGreeting) lines.push('Olá! Sou seu atendente virtual. Vou te ajudar rapidinho.');
  if (wantsPrice) lines.push('Sobre preços: posso te passar valores e condições agora.');
  if (wantsPayment) lines.push('Formas de pagamento: temos opções flexíveis (PIX, cartão, etc.).');
  if (wantsHours) lines.push('Horário de atendimento: posso confirmar nossos horários para você.');

  const relevant = qna.find(i =>
    (wantsPrice && i.question.toLowerCase().includes('preço')) ||
    (wantsPayment && i.question.toLowerCase().includes('pagamento')) ||
    (wantsHours && i.question.toLowerCase().includes('horário'))
  );
  if (relevant?.answer) lines.push(relevant.answer);

  if (lines.length === 0) {
    const snippet = (context || '').split(/\n|\.|;/).filter(Boolean).slice(0, 2).join('. ');
    lines.push(snippet || 'Posso te ajudar com informações sobre nossos produtos e condições.');
  }

  lines.push('Posso te enviar uma proposta agora?');

  const message = lines.filter(Boolean).join(' ');
  const confidence = Math.min(0.9, 0.5 + lines.length * 0.1);
  const action = confidence >= 0.6 ? 'reply' : 'handoff_human';


  console.log('AI gerou resposta:', {
    input: customerMessage,
    output: message,
    outputLength: message?.length,
    confidence,
    action,
  });
  return { message, confidence, action };
}
