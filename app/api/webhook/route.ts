import { createUser, getOrCreateAttendant, getOrCreateChat, getUserByPhoneNumber, sendMessage } from '@/lib/firestore';
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

  console.log(`Message saved: ChatId=${chatId}, MessageId=${messageId}, From=${phoneNumber}`);
}


