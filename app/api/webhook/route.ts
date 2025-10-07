import { writeAiLog } from '@/lib/aiLog';
import { generateSeniorSalesReply } from '@/lib/aiResponder';
import { createUser, getOrCreateAttendant, getOrCreateChat, getUserByPhoneNumber, incrementUnread, sendMessage } from '@/lib/firestore';
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

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  // Create or get chat with attendant user
  // Mark as WhatsApp chat so ALL attendants can see it
  const attendantUserId = await getOrCreateAttendant();
  const chatId = await getOrCreateChat([user.id, attendantUserId], true);

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
    const companyMapping = await getCompanyByPhoneNumberId(phoneNumberId);
    if (!companyMapping) {
      console.log('AI: no company mapping for phoneNumberId', phoneNumberId);
      return;
    }
    const aiConfig = await getAiConfig(companyMapping.companyId);
    if (!aiConfig) {
      console.log('AI: no aiConfig for company', companyMapping.companyId);
      return;
    }
    if (!aiConfig.enabled || aiConfig.status !== 'active') {
      console.log('AI: disabled or not active', { enabled: aiConfig.enabled, status: aiConfig.status });
      await writeAiLog({
        companyId: companyMapping.companyId,
        chatId,
        customerPhone: phoneNumber,
        inboundMessage: messageText,
        action: 'skip',
        meta: { reason: 'disabled_or_not_active' },
      });
      return;
    }

    const ai = generateSeniorSalesReply({
      context: aiConfig.context || '',
      qna: aiConfig.qna || [],
      customerMessage: messageText,
    });

    if (ai.action === 'reply') {
      await sendWhatsAppMessage(
        phoneNumber,
        ai.message,
        companyMapping.phoneNumberId,
        companyMapping.accessToken
      );

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
    }
  } catch (e: any) {
    console.error('AI auto-reply error:', e);
    try {
      const companyMapping = phoneNumberId ? await getCompanyByPhoneNumberId(phoneNumberId) : null;
      if (companyMapping) {
        await writeAiLog({
          companyId: companyMapping.companyId,
          chatId,
          customerPhone: phoneNumber,
          inboundMessage: messageText,
          action: 'skip',
          error: e?.message || 'unknown',
        });
      }
    } catch {}
  }
}


