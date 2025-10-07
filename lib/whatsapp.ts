import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  phoneNumberId: string,
  accessToken: string
) {
  try {
    const normalizedTo = (to || '').replace(/[^\d]/g, '');
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending WhatsApp message:', {
        status: error.response?.status,
        data: error.response?.data,
        to,
        phoneNumberId,
      });
    } else {
      console.error('Error sending WhatsApp message:', error);
    }
    throw error;
  }
}

export async function sendWhatsAppMedia(
  to: string,
  mediaType: 'image' | 'video' | 'audio' | 'document',
  mediaUrl: string,
  caption: string | undefined,
  phoneNumberId: string,
  accessToken: string
) {
  try {
    const normalizedTo = (to || '').replace(/[^\d]/g, '');
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: mediaType,
    };

    payload[mediaType] = {
      link: mediaUrl,
    };

    if (caption && (mediaType === 'image' || mediaType === 'video')) {
      payload[mediaType].caption = caption;
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending WhatsApp media:', {
        status: error.response?.status,
        data: error.response?.data,
        to,
        phoneNumberId,
      });
    } else {
      console.error('Error sending WhatsApp media:', error);
    }
    throw error;
  }
}

export async function markMessageAsRead(
  messageId: string,
  phoneNumberId: string,
  accessToken: string
) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}


