import { FacebookTemplate } from '@/types/templates';

/**
 * Integração com Facebook Graph API para Templates
 * Gerencia submissão, status e aprovação de templates
 */

interface FacebookApiConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
}

interface FacebookTemplateSubmission {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER';
    format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    example?: {
      header_text?: string[];
      body_text?: string[][];
      footer_text?: string;
    };
  }>;
  buttons?: Array<{
    type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

interface FacebookApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  facebookTemplateId?: string;
  facebookSubmissionId?: string;
}

/**
 * Classe para gerenciar integração com Facebook Graph API
 */
export class FacebookApiManager {
  private config: FacebookApiConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookApiConfig) {
    this.config = config;
  }

  /**
   * Submete um template para aprovação no Facebook
   */
  async submitTemplate(template: FacebookTemplate): Promise<FacebookApiResponse> {
    try {
      console.log('📤 Submitting template to Facebook:', template.name);

      // Converter nosso formato para o formato do Facebook
      const facebookTemplate: FacebookTemplateSubmission = {
        name: template.name,
        category: this.mapCategory(template.category),
        language: template.language,
        components: template.components
          .filter(comp => comp.type !== 'BUTTONS') // Filtrar BUTTONS, não são componentes
          .map(comp => ({
            type: comp.type as 'HEADER' | 'BODY' | 'FOOTER',
            format: comp.format,
            text: comp.text,
            example: comp.example,
          })),
        buttons: template.buttons?.map(btn => ({
          type: btn.type,
          text: btn.text,
          url: btn.url,
          phone_number: btn.phone_number,
        })),
      };

      // Fazer requisição para Facebook Graph API
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/message_templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facebookTemplate),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Facebook API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Erro na submissão do template',
        };
      }

      console.log('✅ Template submitted successfully:', data);
      
      return {
        success: true,
        data,
        facebookTemplateId: data.id,
        facebookSubmissionId: data.id, // Facebook retorna o ID do template
      };
    } catch (error) {
      console.error('❌ Error submitting template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Busca status de um template no Facebook
   */
  async getTemplateStatus(facebookTemplateId: string): Promise<FacebookApiResponse> {
    try {
      console.log('🔍 Checking template status:', facebookTemplateId);

      const response = await fetch(
        `${this.baseUrl}/${facebookTemplateId}?fields=status,rejection_reason`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Facebook API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Erro ao buscar status do template',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('❌ Error checking template status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Lista todos os templates aprovados
   */
  async getApprovedTemplates(): Promise<FacebookApiResponse> {
    try {
      console.log('📋 Fetching approved templates');

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/message_templates?status=APPROVED`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Facebook API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Erro ao buscar templates aprovados',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('❌ Error fetching approved templates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Deleta um template do Facebook
   */
  async deleteTemplate(facebookTemplateId: string): Promise<FacebookApiResponse> {
    try {
      console.log('🗑️ Deleting template:', facebookTemplateId);

      const response = await fetch(`${this.baseUrl}/${facebookTemplateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Facebook API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Erro ao deletar template',
        };
      }

      console.log('✅ Template deleted successfully');
      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Valida se as credenciais do Facebook estão funcionando
   */
  async validateCredentials(): Promise<FacebookApiResponse> {
    try {
      console.log('🔐 Validating Facebook credentials');

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}?fields=id,display_phone_number`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Facebook API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Credenciais inválidas',
        };
      }

      console.log('✅ Facebook credentials validated');
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('❌ Error validating credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Mapeia categoria do nosso sistema para o Facebook
   */
  private mapCategory(category: string): 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' {
    switch (category) {
      case 'marketing':
        return 'MARKETING';
      case 'utility':
        return 'UTILITY';
      case 'authentication':
        return 'AUTHENTICATION';
      default:
        return 'UTILITY';
    }
  }

  /**
   * Mapeia status do Facebook para nosso sistema
   */
  static mapFacebookStatus(facebookStatus: string): 'draft' | 'pending' | 'approved' | 'rejected' | 'expired' {
    switch (facebookStatus) {
      case 'APPROVED':
        return 'approved';
      case 'PENDING':
        return 'pending';
      case 'REJECTED':
        return 'rejected';
      case 'EXPIRED':
        return 'expired';
      default:
        return 'draft';
    }
  }
}

/**
 * Função utilitária para criar instância do FacebookApiManager
 */
export async function createFacebookApiManager(companyId: string): Promise<FacebookApiManager | null> {
  try {
    // Buscar configurações do WhatsApp da empresa
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/config?companyId=${companyId}`);
    const config = await response.json();

    if (!response.ok || !config.whatsappAccessToken || !config.whatsappPhoneNumberId) {
      console.error('❌ WhatsApp config not found for company:', companyId);
      return null;
    }

    return new FacebookApiManager({
      accessToken: config.whatsappAccessToken,
      phoneNumberId: config.whatsappPhoneNumberId,
    });
  } catch (error) {
    console.error('❌ Error creating Facebook API manager:', error);
    return null;
  }
}
