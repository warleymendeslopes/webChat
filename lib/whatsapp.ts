import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

/**
 * Corrige números de celular brasileiros adicionando o 9º dígito quando necessário
 * Formato: 55 + DDD (2 dígitos) + 9 + número (8 dígitos) = 13 dígitos
 */
function fixBrazilianPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, '');
  
  // Se não começa com 55 (Brasil), retorna como está
  if (!digitsOnly.startsWith('55')) {
    return digitsOnly;
  }
  
  // Se já tem 13 dígitos (55 + DDD + 9 + 8), está correto
  if (digitsOnly.length === 13) {
    return digitsOnly;
  }
  
  // Se tem 12 dígitos (55 + DDD + 8), falta o 9
  if (digitsOnly.length === 12) {
    const countryCode = digitsOnly.substring(0, 2); // 55
    const ddd = digitsOnly.substring(2, 4); // 31
    const number = digitsOnly.substring(4); // 71087005
    
    // Adiciona o 9 após o DDD
    const fixed = `${countryCode}${ddd}9${number}`;
    console.log(`📱 Corrigindo número brasileiro: ${digitsOnly} → ${fixed}`);
    return fixed;
  }
  
  // Se tem outro tamanho, retorna como está
  return digitsOnly;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  phoneNumberId: string,
  accessToken: string
) {
  try {
    // Normalizar e corrigir formato brasileiro
    const normalizedTo = fixBrazilianPhoneNumber(to);
    
    // Validações
    if (!normalizedTo || normalizedTo.length < 10) {
      throw new Error(`Invalid phone number: ${to} (normalized: ${normalizedTo})`);
    }
    
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    if (!phoneNumberId) {
      throw new Error('phoneNumberId is required');
    }
    
    if (!accessToken || accessToken.length < 20) {
      throw new Error('Invalid accessToken');
    }
    
    console.log('📞 Sending WhatsApp message:', {
      original: to,
      normalized: normalizedTo,
      messagePreview: message.substring(0, 50),
      phoneNumberId,
    });
    
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
      console.error('❌ WhatsApp API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: JSON.stringify(error.response?.data, null, 2),
        to,
        phoneNumberId,
        url: error.config?.url,
      });
    } else {
      console.error('❌ Error sending WhatsApp message:', error);
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
    const normalizedTo = fixBrazilianPhoneNumber(to);
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


