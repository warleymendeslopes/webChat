import { getCollection } from './mongodb';

export async function getWhatsAppConfig(companyId: string) {
  try {
    const collection = await getCollection('webChatConfigs');
    const config = await collection.findOne({ companyId, isActive: true });

    if (!config) {
      throw new Error('WhatsApp configuration not found');
    }

    return {
      phoneNumberId: config.whatsappPhoneNumberId,
      accessToken: config.whatsappAccessToken,
      verifyToken: config.whatsappVerifyToken,
    };
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    throw error;
  }
}
