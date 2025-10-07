import { sendMessage, updateMessageStatus } from '@/lib/firestore';
import { sendWhatsAppMedia, sendWhatsAppMessage } from '@/lib/whatsapp';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chatId, senderId, to, message, mediaUrl, mediaType } = await request.json();
    
    console.log('📤 Send message request:', { chatId, senderId, to, message: message?.substring(0, 50) });

    if (!to || to.length < 10) {
      console.error('❌ Invalid phone number:', to);
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Send via WhatsApp
    console.log('📞 Sending to WhatsApp...');
    let whatsappResponse;
    try {
      if (mediaUrl && mediaType) {
        whatsappResponse = await sendWhatsAppMedia(to, mediaType, mediaUrl, message);
      } else {
        whatsappResponse = await sendWhatsAppMessage(to, message);
      }
      console.log('✅ WhatsApp response:', whatsappResponse);
    } catch (whatsappError: any) {
      console.error('❌ WhatsApp API error:', whatsappError.response?.data || whatsappError.message);
      return NextResponse.json(
        { error: 'WhatsApp API error', details: whatsappError.response?.data || whatsappError.message },
        { status: 500 }
      );
    }

    // Save to Firestore
    console.log('💾 Saving to Firestore...');
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
    console.log('✅ Message saved to Firestore:', messageId);

    // Update status to delivered
    setTimeout(async () => {
      await updateMessageStatus(messageId, 'delivered');
    }, 1000);

    return NextResponse.json({
      success: true,
      messageId,
      whatsappMessageId: whatsappResponse.messages[0].id,
    });
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}


