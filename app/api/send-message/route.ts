import { sendMessage, updateMessageStatus } from '@/lib/firestore';
import { sendWhatsAppMedia, sendWhatsAppMessage } from '@/lib/whatsapp';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chatId, senderId, to, message, mediaUrl, mediaType } = await request.json();

    // Send via WhatsApp
    let whatsappResponse;
    if (mediaUrl && mediaType) {
      whatsappResponse = await sendWhatsAppMedia(to, mediaType, mediaUrl, message);
    } else {
      whatsappResponse = await sendWhatsAppMessage(to, message);
    }

    // Save to Firestore
    const messageId = await sendMessage({
      chatId,
      senderId,
      text: message,
      mediaUrl,
      mediaType,
      status: 'sent',
      isFromWhatsApp: false,
      whatsappMessageId: whatsappResponse.messages[0].id,
    });

    // Update status to delivered
    setTimeout(async () => {
      await updateMessageStatus(messageId, 'delivered');
    }, 1000);

    return NextResponse.json({
      success: true,
      messageId,
      whatsappMessageId: whatsappResponse.messages[0].id,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}


