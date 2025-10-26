// Sistema de Templates do Facebook

export type TemplateStatus = 
  | 'draft'           // Rascunho
  | 'pending'         // Aguardando aprovação
  | 'approved'        // Aprovado
  | 'rejected'        // Rejeitado
  | 'expired';        // Expirado

export type TemplateCategory = 
  | 'marketing'       // Marketing
  | 'utility'         // Utilitário
  | 'authentication'; // Autenticação

export type TemplateComponentType = 
  | 'HEADER'          // Cabeçalho
  | 'BODY'            // Corpo
  | 'FOOTER'          // Rodapé
  | 'BUTTONS';        // Botões

export interface TemplateComponent {
  type: TemplateComponentType;
  format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    footer_text?: string;
  };
}

export interface TemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface FacebookTemplate {
  _id?: string;
  companyId: string;
  name: string;
  category: TemplateCategory;
  language: string; // Código ISO (pt_BR, en_US, etc)
  
  // Estrutura do template
  components: TemplateComponent[];
  buttons?: TemplateButton[];
  
  // Status e aprovação
  status: TemplateStatus;
  facebookTemplateId?: string; // ID retornado pelo Facebook
  rejectionReason?: string;
  
  // Metadados
  description?: string;
  tags: string[];
  isActive: boolean;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;
  
  // Usuário responsável
  createdBy: string; // ID do usuário que criou
  lastModifiedBy: string; // ID do último usuário que modificou
}

export interface TemplateSubmission {
  _id?: string;
  templateId: string;
  companyId: string;
  facebookSubmissionId?: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  submittedAt: Date;
  completedAt?: Date;
}

export interface TemplateStats {
  total: number;
  byStatus: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  };
  byCategory: {
    marketing: number;
    utility: number;
    authentication: number;
  };
  recentSubmissions: number;
  approvalRate: number;
}

export interface TemplateFilters {
  status?: TemplateStatus[];
  category?: TemplateCategory[];
  language?: string[];
  tags?: string[];
  search?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
}
