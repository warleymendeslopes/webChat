import { writeAiLog } from '@/lib/aiLog';
import { generateSeniorSalesReply } from '@/lib/aiResponder';
import { distributeChat, getOrCreateChatAssignment, updateChatActivity } from '@/lib/chatDistribution';
import { createUser, getMessagesSince, getOrCreateAttendant, getOrCreateChat, getUserByPhoneNumber, incrementUnread, sendMessage, setChatAiControl } from '@/lib/firestore';
import { getOrCreateLead, updateLeadInteraction } from '@/lib/leads';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getAiConfig, getCompanyByPhoneNumberId } from '@/lib/whatsappConfig';
import { WhatsAppMessage } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// Webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Debug logs
  console.log('=== WEBHOOK VERIFICATION DEBUG ===');
  console.log('Mode:', mode);
  console.log('Token received:', token);
  console.log('Token expected:', verifyToken);
  console.log('Challenge:', challenge);
  console.log('URL:', request.url);
  console.log('================================');

  // Check if verify token is configured
  if (!verifyToken) {
    console.error('WHATSAPP_VERIFY_TOKEN not configured');
    return NextResponse.json({ error: 'Verify token not configured' }, { status: 500 });
  }

  // Check if mode is subscribe
  if (mode !== 'subscribe') {
    console.error('Invalid mode:', mode);
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  // Check if token matches
  if (token !== verifyToken) {
    console.error('Token mismatch. Received:', token, 'Expected:', verifyToken);
    return NextResponse.json({ error: 'Token mismatch' }, { status: 403 });
  }

  // Check if challenge is provided
  if (!challenge) {
    console.error('No challenge provided');
    return NextResponse.json({ error: 'No challenge' }, { status: 400 });
  }

  console.log('✅ Webhook verified successfully');
  return new NextResponse(challenge, { status: 200 });
}

// Webhook handler (POST)
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppMessage = await request.json();

    // Process incoming messages
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              await handleIncomingMessage(message, change.value);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  const phoneNumber = message.from;
  const messageText = message.text?.body || '';
  const whatsappMessageId = message.id;
  const phoneNumberId = metadata?.metadata?.phone_number_id;

  // Get or create user
  let user = await getUserByPhoneNumber(phoneNumber);
  
  if (!user) {
    const contactName = metadata.contacts?.[0]?.profile?.name || phoneNumber;
    const userId = await createUser({
      name: contactName,
      phoneNumber: phoneNumber,
      isOnline: false,
    });
    user = await getUserByPhoneNumber(phoneNumber);
  }

  if (!user) {
    console.error('Failed to create or retrieve user');
    return;
  }

  // Get company mapping first to ensure proper isolation
  const companyMapping = await getCompanyByPhoneNumberId(phoneNumberId);
  if (!companyMapping) {
    console.error('No company mapping found for phoneNumberId:', phoneNumberId);
    return;
  }

  // Create or get chat with attendant user
  // Mark as WhatsApp chat but ISOLATED BY COMPANY
  const attendantUserId = await getOrCreateAttendant();
  const chatId = await getOrCreateChat([user.id, attendantUserId], true, companyMapping.companyId);

  // 🆕 NOVO: Gerenciar atribuição do chat
  const assignment = await getOrCreateChatAssignment(
    chatId,
    companyMapping.companyId,
    new Date() // Timestamp da mensagem do cliente
  );

  // 🆕 NOVO: Distribuir automaticamente se ainda não atribuído
  let assignedAttendant: string | undefined;
  if (!assignment.assignedTo) {
    console.log(`📋 New chat detected, attempting automatic distribution...`);
    const attendant = await distributeChat(chatId, companyMapping.companyId);
    
    if (attendant) {
      assignedAttendant = attendant;
      console.log(`✅ Chat ${chatId} auto-assigned to attendant ${attendant}`);
    } else {
      console.warn(`⚠️ No available attendant for chat ${chatId}`);
    }
  } else {
    assignedAttendant = assignment.assignedTo;
  }

  // 🆕 NOVO: Criar ou buscar lead (CRM)
  try {
    const contactName = metadata.contacts?.[0]?.profile?.name || user.name || phoneNumber;
    await getOrCreateLead(
      chatId,
      user.id,
      phoneNumber,
      contactName,
      companyMapping.companyId,
      assignedAttendant
    );
    console.log(`📊 Lead created/updated for ${phoneNumber}`);
  } catch (leadError) {
    console.error('⚠️ Failed to create/update lead:', leadError);
    // Não bloqueia o fluxo de mensagem
  }

  // 🆕 NOVO: Atualizar atividade do chat (registrar mensagem do cliente)
  await updateChatActivity(chatId, true);
  
  // 🆕 NOVO: Atualizar interação do lead
  try {
    await updateLeadInteraction(chatId, true);
  } catch (interactionError) {
    console.error('⚠️ Failed to update lead interaction:', interactionError);
  }

  // Save message to Firestore
  const messageId = await sendMessage({
    chatId,
    senderId: user.id,
    text: messageText,
    status: 'delivered',
    isFromWhatsApp: true,
    whatsappMessageId,
  });

  // Increment unread for attendant
  try {
    await incrementUnread(chatId, attendantUserId);
  } catch (e) {
    console.error('Failed to increment unread:', e);
  }

  console.log(`Message saved: ChatId=${chatId}, MessageId=${messageId}, From=${phoneNumber}`);

  // AI auto-reply if enabled
  try {
    if (!phoneNumberId) {
      console.log('AI: no phoneNumberId in metadata');
      return;
    }
    // companyMapping já foi obtido acima
    const aiConfig = await getAiConfig(companyMapping.companyId);
    if (!aiConfig) {
      console.log('AI: no aiConfig for company', companyMapping.companyId);
      return;
    }
    if (!aiConfig.enabled || aiConfig.status !== 'active') {
      console.log('AI: disabled or not active', { enabled: aiConfig.enabled, status: aiConfig.status });
      // Do not store logs when AI is disabled/not active
      return;
    }

    // Busca a chave da API do aiConfig
    const apiKey = (aiConfig as any)?.aiApiKey || '';
    
    // Se não tiver API key, não ativa o agente AI
    if (!apiKey || apiKey.trim().length === 0) {
      console.log('⚠️ AI não pode ser ativado - nenhuma API key configurada');
      await writeAiLog({
        companyId: companyMapping.companyId,
        chatId,
        customerPhone: phoneNumber,
        inboundMessage: messageText,
        action: 'skip',
        meta: { reason: 'no_api_key' },
      });
      return;
    }

    console.log('🔑 API Key encontrada, montando histórico e chamando Gemini...');

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let transcript = '';
    try {
      const recentMessages = await getMessagesSince(chatId, since, 30);
      const lines = recentMessages.map((m) => {
        const role = m.isFromWhatsApp ? 'Cliente' : 'Atendente';
        const text = (m as any).text || '';
        return `${role}: ${text}`;
      });
      transcript = lines.slice(-15).join('\n');
    } catch (histErr) {
      console.log('⚠️ Falha ao montar histórico, seguindo sem histórico.', histErr);
    }

    const ai = await generateSeniorSalesReply({
      context: aiConfig.context || '',
      qna: aiConfig.qna || [],
      customerMessage: messageText,
      apiKey: apiKey,
      conversationContext: transcript,
    });

    // Se a função retornou null (erro no Gemini), deixa para atendente humano
    if (!ai) {
      console.log('⚠️ Gemini não respondeu - deixando para atendente humano');
      await writeAiLog({
        companyId: companyMapping.companyId,
        chatId,
        customerPhone: phoneNumber,
        inboundMessage: messageText,
        action: 'handoff_human',
        meta: { reason: 'gemini_error' },
      });
      return;
    }

    // 🔍 LOG DETALHADO
    console.log('🤖 AI gerou resposta:', {
      input: messageText,
      output: ai.message,
      outputLength: ai.message?.length,
      confidence: ai.confidence,
      action: ai.action,
      context: aiConfig.context?.substring(0, 50) || 'EMPTY',
      qnaCount: aiConfig.qna?.length || 0,
    });

    if (ai.action === 'reply') {
      const FALLBACK_MESSAGE = 'Olá! Nosso atendente virtual está temporariamente indisponível. Seu atendimento está na fila e você será atendido em breve por um de nossos especialistas. Obrigado pela compreensão! 😊';
      
      // Validação antes de enviar
      if (!ai.message || ai.message.trim().length === 0) {
        console.error('❌ AI gerou mensagem VAZIA! Enviando mensagem de fallback.');
        
        try {
          // 🔧 FIX 1: Adicionar delay de 2 segundos
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          await sendWhatsAppMessage(
            phoneNumber,
            FALLBACK_MESSAGE,
            companyMapping.phoneNumberId,
            companyMapping.accessToken
          );
          
          await sendMessage({
            chatId,
            senderId: attendantUserId,
            text: FALLBACK_MESSAGE,
            status: 'sent',
            isFromWhatsApp: false,
          });
          
          await writeAiLog({
            companyId: companyMapping.companyId,
            chatId,
            customerPhone: phoneNumber,
            inboundMessage: messageText,
            action: 'skip',
            error: 'empty_ai_message_fallback_sent',
          });
          
          console.log('✅ Mensagem de fallback enviada (AI vazia)');
        } catch (fallbackErr: any) {
          console.error('❌ Erro ao enviar mensagem de fallback:', fallbackErr);
        }
        return;
      }

      // 🔧 FIX 2: Validar formato E.164 do número
      const normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
      if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
        console.error('❌ Número de telefone inválido:', { original: phoneNumber, normalized: normalizedPhone });
        return;
      }

      console.log('📤 Enviando para WhatsApp:', {
        to: phoneNumber,
        normalizedTo: normalizedPhone,
        message: ai.message.substring(0, 100),
        messageLength: ai.message.length,
        phoneNumberId: companyMapping.phoneNumberId,
        tokenPresent: !!companyMapping.accessToken,
        tokenLength: companyMapping.accessToken?.length,
        tokenPrefix: companyMapping.accessToken?.substring(0, 20) + '...',
      });

      try {
        // 🔧 FIX 3: Delay de 2 segundos antes de responder (evitar race condition)
        console.log('⏳ Aguardando 2s antes de enviar (evitar race condition)...');
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        await sendWhatsAppMessage(
          phoneNumber,
          ai.message,
          companyMapping.phoneNumberId,
          companyMapping.accessToken
        );
        console.log('✅ Mensagem AI enviada com sucesso!');
      } catch (err: any) {
        const meta = {
          to: phoneNumber,
          normalizedTo: normalizedPhone,
          phoneNumberId: companyMapping.phoneNumberId,
          status: err?.response?.status,
          errorData: err?.response?.data,
          errorMessage: err?.message,
          tokenLength: companyMapping.accessToken?.length,
        };
        console.error('❌ AI WhatsApp send error:', JSON.stringify(meta, null, 2));
        
        // Tentar enviar mensagem de fallback
        console.log('🔄 Tentando enviar mensagem de fallback...');
        try {
          // Adicionar outro delay antes do fallback
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await sendWhatsAppMessage(
            phoneNumber,
            FALLBACK_MESSAGE,
            companyMapping.phoneNumberId,
            companyMapping.accessToken
          );
          
          await sendMessage({
            chatId,
            senderId: attendantUserId,
            text: FALLBACK_MESSAGE,
            status: 'sent',
            isFromWhatsApp: false,
          });
          
          await writeAiLog({
            companyId: companyMapping.companyId,
            chatId,
            customerPhone: phoneNumber,
            inboundMessage: messageText,
            action: 'skip',
            error: err?.message || 'whatsapp_send_error_fallback_sent',
            meta,
          });
          
          console.log('✅ Mensagem de fallback enviada com sucesso');
        } catch (fallbackErr: any) {
          console.error('❌ Erro ao enviar mensagem de fallback:', fallbackErr);
          
          await writeAiLog({
            companyId: companyMapping.companyId,
            chatId,
            customerPhone: phoneNumber,
            inboundMessage: messageText,
            action: 'skip',
            error: 'ai_and_fallback_failed',
            meta: {
              originalError: err?.message,
              fallbackError: fallbackErr?.message,
            },
          });
        }
        return;
      }

      await sendMessage({
        chatId,
        senderId: attendantUserId,
        text: ai.message,
        status: 'sent',
        isFromWhatsApp: false,
      });

      await writeAiLog({
        companyId: companyMapping.companyId,
        chatId,
        customerPhone: phoneNumber,
        inboundMessage: messageText,
        aiMessage: ai.message,
        confidence: ai.confidence,
        action: 'reply',
      });

      await setChatAiControl(chatId, true);

      console.log('AI auto-reply sent');
    } else {
      await writeAiLog({
        companyId: companyMapping.companyId,
        chatId,
        customerPhone: phoneNumber,
        inboundMessage: messageText,
        confidence: ai.confidence,
        action: 'handoff_human',
        meta: { note: 'confidence below threshold' },
      });
      await setChatAiControl(chatId, false);
    }
  } catch (e: any) {
    console.error('AI auto-reply error:', e);
    const isTimeout = e?.name === 'GeminiTimeoutError' || /timed out/i.test(e?.message || '');
    try {
      const companyMapping = phoneNumberId ? await getCompanyByPhoneNumberId(phoneNumberId) : null;
      if (companyMapping) {
        await writeAiLog({
          companyId: companyMapping.companyId,
          chatId,
          customerPhone: phoneNumber,
          inboundMessage: messageText,
          action: 'handoff_human',
          error: e?.message || (isTimeout ? 'gemini_timeout' : 'gemini_error'),
          meta: {
            reason: isTimeout ? 'gemini_timeout' : 'gemini_error',
            name: e?.name,
            code: e?.code,
            status: e?.response?.status,
            errorData: e?.response?.data,
          },
        });
        await setChatAiControl(chatId, false);
      }
    } catch {}
  }
}


