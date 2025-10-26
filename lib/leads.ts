import { Lead, LeadActivity, LeadFilters, LeadStats, LeadStatus } from '@/types/leads';
import { ObjectId } from 'mongodb';
import { getCollection } from './mongodb';

/**
 * Sistema de Gerenciamento de Leads e CRM
 * Rastreia e gerencia todos os contatos da empresa
 */

// ====================
// CRIAÇÃO E BUSCA
// ====================

/**
 * Cria um novo lead
 */
export async function createLead(leadData: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const collection = await getCollection('leads');
  
  const lead: Omit<Lead, '_id'> = {
    ...leadData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(lead);
  
  console.log(`✅ Lead created: ${leadData.name} (${leadData.phoneNumber})`);
  
  return result.insertedId.toString();
}

/**
 * Busca lead pelo chatId
 */
export async function getLeadByChatId(chatId: string): Promise<Lead | null> {
  const collection = await getCollection('leads');
  const lead = await collection.findOne({ chatId, isActive: true });
  
  if (!lead) return null;
  
  return {
    ...lead,
    _id: lead._id.toString(),
  } as Lead;
}

/**
 * Busca lead pelo telefone
 */
export async function getLeadByPhone(phoneNumber: string, companyId: string): Promise<Lead | null> {
  const collection = await getCollection('leads');
  const lead = await collection.findOne({ 
    phoneNumber, 
    companyId, 
    isActive: true 
  });
  
  if (!lead) return null;
  
  return {
    ...lead,
    _id: lead._id.toString(),
  } as Lead;
}

/**
 * Busca lead por ID
 */
export async function getLeadById(leadId: string): Promise<Lead | null> {
  const collection = await getCollection('leads');
  const lead = await collection.findOne({ _id: new ObjectId(leadId) });
  
  if (!lead) return null;
  
  return {
    ...lead,
    _id: lead._id.toString(),
  } as Lead;
}

/**
 * Busca ou cria lead automaticamente
 */
export async function getOrCreateLead(
  chatId: string,
  firestoreUserId: string,
  phoneNumber: string,
  name: string,
  companyId: string,
  assignedTo?: string
): Promise<Lead> {
  // Tentar buscar por chatId primeiro
  let lead = await getLeadByChatId(chatId);
  
  if (lead) {
    return lead;
  }

  // Tentar buscar por telefone (pode ter histórico)
  lead = await getLeadByPhone(phoneNumber, companyId);
  
  if (lead) {
    // Atualizar com novo chatId
    await updateLead(lead._id!, { chatId });
    return { ...lead, chatId };
  }

  // Criar novo lead
  const leadId = await createLead({
    companyId,
    firestoreUserId,
    chatId,
    phoneNumber,
    name,
    status: 'new',
    stage: 'lead',
    tags: [],
    notes: '',
    source: 'whatsapp',
    firstContactAt: new Date(),
    lastContactAt: new Date(),
    lastMessageFrom: 'customer',
    totalMessages: 1,
    totalInteractions: 1,
    assignedTo,
    isActive: true,
    isFavorite: false,
    hasWhatsApp: true,
  });

  const newLead = await getLeadById(leadId);
  
  if (!newLead) {
    throw new Error('Failed to create lead');
  }
  
  return newLead;
}

// ====================
// ATUALIZAÇÃO
// ====================

/**
 * Atualiza dados do lead
 */
export async function updateLead(
  leadId: string,
  updates: Partial<Omit<Lead, '_id' | 'createdAt'>>
): Promise<void> {
  const collection = await getCollection('leads');
  
  await collection.updateOne(
    { _id: new ObjectId(leadId) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Atualiza status do lead
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  extra?: {
    closedValue?: number;
    lostReason?: string;
    lostReasonCategory?: string;
    notes?: string;
  }
): Promise<void> {
  const collection = await getCollection('leads');
  
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  // Atualizar stage baseado no status
  if (status === 'won') {
    updates.stage = 'customer';
    updates.wonAt = new Date();
    if (extra?.closedValue) updates.closedValue = extra.closedValue;
  } else if (status === 'lost') {
    updates.lostAt = new Date();
    if (extra?.lostReason) updates.lostReason = extra.lostReason;
    if (extra?.lostReasonCategory) updates.lostReasonCategory = extra.lostReasonCategory;
  } else if (status === 'qualified') {
    updates.stage = 'opportunity';
    updates.qualifiedAt = new Date();
  } else if (status === 'negotiating') {
    updates.stage = 'opportunity';
    updates.negotiatingAt = new Date();
  }

  if (extra?.notes) {
    updates.notes = extra.notes;
  }

  await collection.updateOne(
    { _id: new ObjectId(leadId) },
    { $set: updates }
  );

  console.log(`📊 Lead status updated to: ${status}`);
  
  // Registrar atividade
  await logLeadActivity(
    leadId,
    'status_change',
    `Status alterado para ${status}`,
    extra?.closedValue ? { closedValue: extra.closedValue } : undefined
  );
}

/**
 * Adiciona tag ao lead
 */
export async function addTagToLead(leadId: string, tag: string): Promise<void> {
  const collection = await getCollection('leads');
  
  await collection.updateOne(
    { _id: new ObjectId(leadId) },
    {
      $addToSet: { tags: tag },
      $set: { updatedAt: new Date() },
    }
  );
  
  await logLeadActivity(leadId, 'tag_added', `Tag adicionada: ${tag}`);
}

/**
 * Remove tag do lead
 */
export async function removeTagFromLead(leadId: string, tag: string): Promise<void> {
  const collection = await getCollection('leads');
  
  await collection.updateOne(
    { _id: new ObjectId(leadId) },
    {
      $pull: { tags: tag } as any,
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * Atualiza interação do lead
 */
export async function updateLeadInteraction(
  chatId: string,
  isFromCustomer: boolean
): Promise<void> {
  const collection = await getCollection('leads');
  
  const lead = await getLeadByChatId(chatId);
  if (!lead) return;

  const updates: any = {
    lastContactAt: new Date(),
    lastMessageFrom: isFromCustomer ? 'customer' : 'attendant',
    updatedAt: new Date(),
  };

  // Incrementar contadores
  await collection.updateOne(
    { chatId },
    {
      $set: updates,
      $inc: { 
        totalMessages: 1,
        // Incrementar interações apenas se for bidirecional
        totalInteractions: isFromCustomer && lead.lastMessageFrom !== 'customer' ? 1 : 0,
      },
    }
  );

  // Auto-update de status
  if (lead.status === 'new' && !isFromCustomer) {
    // Primeira mensagem do atendente → muda para "contacted"
    await updateLeadStatus(lead._id!, 'contacted');
  }
}

// ====================
// BUSCA E LISTAGEM
// ====================

/**
 * Busca leads com filtros
 */
export async function getLeadsWithFilters(
  companyId: string,
  filters: LeadFilters = {},
  limit: number = 50,
  skip: number = 0
): Promise<Lead[]> {
  const collection = await getCollection('leads');
  
  const query: any = { companyId, isActive: true };

  // Aplicar filtros
  if (filters.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.stage && filters.stage.length > 0) {
    query.stage = { $in: filters.stage };
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { phoneNumber: searchRegex },
      { email: searchRegex },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
  }

  if (filters.minValue !== undefined || filters.maxValue !== undefined) {
    query.closedValue = {};
    if (filters.minValue !== undefined) query.closedValue.$gte = filters.minValue;
    if (filters.maxValue !== undefined) query.closedValue.$lte = filters.maxValue;
  }

  if (filters.isFavorite !== undefined) {
    query.isFavorite = filters.isFavorite;
  }

  if (filters.source && filters.source.length > 0) {
    query.source = { $in: filters.source };
  }

  if (filters.hasNotes) {
    query.notes = { $ne: '' };
  }

  const leads = await collection
    .find(query)
    .sort({ lastContactAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return leads.map(l => ({
    ...l,
    _id: l._id.toString(),
  })) as Lead[];
}

/**
 * Conta leads por filtros
 */
export async function countLeads(
  companyId: string,
  filters: LeadFilters = {}
): Promise<number> {
  const collection = await getCollection('leads');
  
  const query: any = { companyId, isActive: true };

  // Aplicar mesmos filtros que getLeadsWithFilters
  if (filters.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }
  // ... (mesma lógica de filtros)

  return await collection.countDocuments(query);
}

// ====================
// ESTATÍSTICAS
// ====================

/**
 * Calcula estatísticas de leads
 */
export async function getLeadStats(companyId: string, days: number = 30): Promise<LeadStats> {
  const collection = await getCollection('leads');
  
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  // Buscar todos os leads
  const allLeads = await collection.find({ companyId, isActive: true }).toArray();

  // Contar por status
  const byStatus = {
    new: allLeads.filter(l => l.status === 'new').length,
    contacted: allLeads.filter(l => l.status === 'contacted').length,
    qualified: allLeads.filter(l => l.status === 'qualified').length,
    negotiating: allLeads.filter(l => l.status === 'negotiating').length,
    won: allLeads.filter(l => l.status === 'won').length,
    lost: allLeads.filter(l => l.status === 'lost').length,
  };

  // Calcular valores
  const wonLeads = allLeads.filter(l => l.status === 'won');
  const totalValue = wonLeads.reduce((sum, l) => sum + (l.closedValue || 0), 0);
  const avgTicket = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;
  
  const negotiating = allLeads.filter(l => l.status === 'negotiating');
  const negotiatingValue = negotiating.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  // Calcular taxas
  const totalLeads = allLeads.length;
  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
  const qualifiedLeads = allLeads.filter(l => ['qualified', 'negotiating', 'won'].includes(l.status)).length;
  const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

  // Período específico
  const periodLeads = allLeads.filter(l => l.createdAt >= periodStart);
  const periodWon = wonLeads.filter(l => l.wonAt && l.wonAt >= periodStart);
  const periodRevenue = periodWon.reduce((sum, l) => sum + (l.closedValue || 0), 0);

  // Tempo médio de conversão
  let avgConversionTime = 0;
  if (wonLeads.length > 0) {
    const conversionTimes = wonLeads
      .filter(l => l.wonAt)
      .map(l => {
        const diff = l.wonAt!.getTime() - l.firstContactAt.getTime();
        return diff / (1000 * 60 * 60 * 24); // Converter para dias
      });
    
    if (conversionTimes.length > 0) {
      avgConversionTime = conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length;
    }
  }

  return {
    companyId,
    byStatus,
    totalValue,
    negotiatingValue,
    avgTicket,
    conversionRate,
    qualificationRate,
    avgConversionTime,
    avgResponseTime: 0, // TODO: Calcular baseado em mensagens
    period: {
      newLeads: periodLeads.length,
      closedDeals: periodWon.length,
      revenue: periodRevenue,
    },
    topAttendants: [], // TODO: Implementar ranking
  };
}

/**
 * Busca tags mais usadas
 */
export async function getPopularTags(companyId: string, limit: number = 20): Promise<string[]> {
  const collection = await getCollection('leads');
  
  const leads = await collection.find({ companyId, isActive: true }).toArray();
  
  // Contar frequência de cada tag
  const tagCounts: Record<string, number> = {};
  
  for (const lead of leads) {
    if (lead.tags && Array.isArray(lead.tags)) {
      for (const tag of lead.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  // Ordenar por frequência
  const sorted = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);

  return sorted;
}

// ====================
// ATIVIDADES
// ====================

/**
 * Registra atividade do lead
 */
async function logLeadActivity(
  leadId: string,
  type: LeadActivity['type'],
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  const collection = await getCollection('leadActivities');
  
  const lead = await getLeadById(leadId);
  if (!lead) return;

  await collection.insertOne({
    leadId,
    companyId: lead.companyId,
    type,
    description,
    performedBy: lead.assignedTo || 'system',
    metadata,
    createdAt: new Date(),
  });
}

/**
 * Busca histórico de atividades do lead
 */
export async function getLeadActivities(leadId: string, limit: number = 50): Promise<LeadActivity[]> {
  const collection = await getCollection('leadActivities');
  
  const activities = await collection
    .find({ leadId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return activities.map(a => ({
    ...a,
    _id: a._id.toString(),
  })) as LeadActivity[];
}

// ====================
// FAVORITOS
// ====================

/**
 * Marca/desmarca lead como favorito
 */
export async function toggleFavorite(leadId: string): Promise<boolean> {
  const lead = await getLeadById(leadId);
  if (!lead) return false;

  const newFavoriteState = !lead.isFavorite;
  
  await updateLead(leadId, { isFavorite: newFavoriteState });
  
  return newFavoriteState;
}

// ====================
// REATRIBUIÇÃO
// ====================

/**
 * Reatribui lead para outro atendente
 */
export async function reassignLead(leadId: string, newAttendantId: string): Promise<void> {
  await updateLead(leadId, { assignedTo: newAttendantId });
  
  await logLeadActivity(
    leadId,
    'assigned',
    `Lead reatribuído para atendente ${newAttendantId}`
  );
}

// ====================
// BULK OPERATIONS
// ====================

/**
 * Atualiza múltiplos leads
 */
export async function bulkUpdateLeads(
  leadIds: string[],
  updates: Partial<Lead>
): Promise<number> {
  const collection = await getCollection('leads');
  
  const result = await collection.updateMany(
    { _id: { $in: leadIds.map(id => new ObjectId(id)) } },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
}

/**
 * Adiciona tag em múltiplos leads
 */
export async function bulkAddTag(leadIds: string[], tag: string): Promise<number> {
  const collection = await getCollection('leads');
  
  const result = await collection.updateMany(
    { _id: { $in: leadIds.map(id => new ObjectId(id)) } },
    {
      $addToSet: { tags: tag },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount;
}

// ====================
// RELATÓRIOS
// ====================

/**
 * Busca leads por atendente
 */
export async function getLeadsByAttendant(
  companyId: string,
  attendantId: string
): Promise<Lead[]> {
  const collection = await getCollection('leads');
  
  const leads = await collection
    .find({ 
      companyId, 
      assignedTo: attendantId,
      isActive: true 
    })
    .sort({ lastContactAt: -1 })
    .toArray();

  return leads.map(l => ({
    ...l,
    _id: l._id.toString(),
  })) as Lead[];
}

/**
 * Calcula performance de atendente
 */
export async function getAttendantPerformance(
  companyId: string,
  attendantId: string,
  days: number = 30
): Promise<{
  totalLeads: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  avgTicket: number;
  conversionRate: number;
}> {
  const collection = await getCollection('leads');
  
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  const leads = await collection.find({
    companyId,
    assignedTo: attendantId,
    isActive: true,
    createdAt: { $gte: periodStart },
  }).toArray();

  const wonDeals = leads.filter(l => l.status === 'won');
  const lostDeals = leads.filter(l => l.status === 'lost');
  const totalRevenue = wonDeals.reduce((sum, l) => sum + (l.closedValue || 0), 0);
  const avgTicket = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
  const conversionRate = leads.length > 0 ? (wonDeals.length / leads.length) * 100 : 0;

  return {
    totalLeads: leads.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    totalRevenue,
    avgTicket,
    conversionRate,
  };
}

