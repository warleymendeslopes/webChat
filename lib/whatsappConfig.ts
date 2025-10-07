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

export async function getCompanyByPhoneNumberId(phoneNumberId: string) {
  try {
    const collection = await getCollection('webChatConfigs');
    const config = await collection.findOne({ whatsappPhoneNumberId: phoneNumberId, isActive: true });

    if (!config) {
      return null;
    }

    return {
      companyId: config.companyId as string,
      phoneNumberId: config.whatsappPhoneNumberId as string,
      accessToken: config.whatsappAccessToken as string,
    };
  } catch (error) {
    console.error('Error fetching company by phone number id:', error);
    throw error;
  }
}

export async function getAiConfig(companyId: string) {
  try {
    const collection = await getCollection('aiConfigs');
    const ai = await collection.findOne({ companyId });
    // Retorna o aiConfig completo, incluindo a aiApiKey
    return ai || null;
  } catch (error) {
    console.error('Error fetching AI config:', error);
    throw error;
  }
}
