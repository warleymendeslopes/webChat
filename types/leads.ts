// Sistema de CRM e Leads

export type LeadStatus = 
  | 'new'           // Novo contato
  | 'contacted'     // Já foi contatado
  | 'qualified'     // Qualificado (tem interesse)
  | 'negotiating'   // Em negociação
  | 'won'           // Venda fechada
  | 'lost';         // Sem interesse / Perdido

export type LeadStage = 
  | 'lead'          // Lead inicial
  | 'opportunity'   // Oportunidade de venda
  | 'customer';     // Cliente (venda fechada)

export type LeadSource = 
  | 'whatsapp'      // Veio pelo WhatsApp
  | 'web'           // Formulário web
  | 'manual'        // Cadastrado manualmente
  | 'import';       // Importado de planilha

export interface Lead {
  _id?: string;
  companyId: string;
  
  // LINKS COM OUTRAS COLLECTIONS
  firestoreUserId: string;  // ID do user no Firestore
  chatId: string;            // ID do chat ativo
  
  // DADOS DO CONTATO
  phoneNumber: string;
  name: string;
  email?: string;
  
  // STATUS E CLASSIFICAÇÃO
  status: LeadStatus;
  stage: LeadStage;
  
  // TAGS PERSONALIZÁVEIS
  tags: string[];
  
  // NOTAS E CONTEXTO
  notes: string;
  customFields?: Record<string, any>;
  
  // VALOR
  estimatedValue?: number;
  closedValue?: number;
  
  // MOTIVOS (SE PERDIDO)
  lostReason?: string;
  lostReasonCategory?: 'price' | 'competition' | 'no_interest' | 'no_contact' | 'other';
  
  // ATRIBUIÇÃO
  assignedTo?: string; // ID do atendente responsável
  
  // ORIGEM
  source: LeadSource;
  
  // TRACKING DE INTERAÇÕES
  firstContactAt: Date;
  lastContactAt: Date;
  lastMessageFrom: 'customer' | 'attendant' | 'ai';
  totalMessages: number;
  totalInteractions: number; // Contatos bidirecionales
  
  // DATAS IMPORTANTES
  createdAt: Date;
  updatedAt: Date;
  qualifiedAt?: Date;
  negotiatingAt?: Date;
  wonAt?: Date;
  lostAt?: Date;
  
  // FLAGS
  isActive: boolean;
  isFavorite: boolean;
  hasWhatsApp: boolean;
}

export interface LeadStats {
  companyId: string;
  
  // CONTADORES POR STATUS
  byStatus: {
    new: number;
    contacted: number;
    qualified: number;
    negotiating: number;
    won: number;
    lost: number;
  };
  
  // VALORES
  totalValue: number;          // Soma de todas as vendas
  negotiatingValue: number;    // Valor em negociação
  avgTicket: number;           // Ticket médio
  
  // TAXAS
  conversionRate: number;      // Taxa de conversão (%)
  qualificationRate: number;   // Taxa de qualificação (%)
  
  // TEMPO
  avgConversionTime: number;   // Dias médios para fechar
  avgResponseTime: number;     // Tempo médio de resposta
  
  // POR PERÍODO
  period: {
    newLeads: number;
    closedDeals: number;
    revenue: number;
  };
  
  // TOP PERFORMERS
  topAttendants: Array<{
    attendantId: string;
    attendantName: string;
    closedDeals: number;
    revenue: number;
    conversionRate: number;
  }>;
}

export interface LeadFilters {
  status?: LeadStatus[];
  stage?: LeadStage[];
  tags?: string[];
  assignedTo?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minValue?: number;
  maxValue?: number;
  isFavorite?: boolean;
  source?: LeadSource[];
  hasNotes?: boolean;
}

export interface LeadActivity {
  _id?: string;
  leadId: string;
  companyId: string;
  type: 'status_change' | 'note_added' | 'tag_added' | 'assigned' | 'value_updated';
  description: string;
  performedBy: string; // ID do atendente
  metadata?: Record<string, any>;
  createdAt: Date;
}

