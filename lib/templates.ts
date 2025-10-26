import { FacebookTemplate, TemplateFilters, TemplateStats, TemplateSubmission } from '@/types/templates';
import { ObjectId } from 'mongodb';
import { getCollection } from './mongodb';

/**
 * Sistema de Gerenciamento de Templates do Facebook
 * Gerencia templates, submissões e status de aprovação
 */

// ====================
// CRIAÇÃO E BUSCA
// ====================

/**
 * Cria um novo template
 */
export async function createTemplate(templateData: Omit<FacebookTemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const collection = await getCollection('facebookTemplates');
  
  const template: Omit<FacebookTemplate, '_id'> = {
    ...templateData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(template);
  
  console.log(`✅ Template created: ${templateData.name} (${templateData.category})`);
  
  return result.insertedId.toString();
}

/**
 * Busca template por ID
 */
export async function getTemplateById(templateId: string): Promise<FacebookTemplate | null> {
  const collection = await getCollection('facebookTemplates');
  const template = await collection.findOne({ _id: new ObjectId(templateId) });
  
  if (!template) return null;
  
  return {
    ...template,
    _id: template._id.toString(),
  } as FacebookTemplate;
}

/**
 * Busca template por Facebook ID
 */
export async function getTemplateByFacebookId(facebookTemplateId: string): Promise<FacebookTemplate | null> {
  const collection = await getCollection('facebookTemplates');
  const template = await collection.findOne({ facebookTemplateId });
  
  if (!template) return null;
  
  return {
    ...template,
    _id: template._id.toString(),
  } as FacebookTemplate;
}

/**
 * Busca templates com filtros
 */
export async function getTemplatesWithFilters(
  companyId: string,
  filters: TemplateFilters = {},
  limit: number = 50,
  skip: number = 0
): Promise<FacebookTemplate[]> {
  const collection = await getCollection('facebookTemplates');
  
  const query: any = { companyId, isActive: true };

  // Aplicar filtros
  if (filters.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.category && filters.category.length > 0) {
    query.category = { $in: filters.category };
  }

  if (filters.language && filters.language.length > 0) {
    query.language = { $in: filters.language };
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.createdBy) {
    query.createdBy = filters.createdBy;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const templates = await collection
    .find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return templates.map(t => ({
    ...t,
    _id: t._id.toString(),
  })) as FacebookTemplate[];
}

/**
 * Conta templates por filtros
 */
export async function countTemplates(
  companyId: string,
  filters: TemplateFilters = {}
): Promise<number> {
  const collection = await getCollection('facebookTemplates');
  
  const query: any = { companyId, isActive: true };

  // Aplicar mesmos filtros que getTemplatesWithFilters
  if (filters.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }
  if (filters.category && filters.category.length > 0) {
    query.category = { $in: filters.category };
  }
  if (filters.language && filters.language.length > 0) {
    query.language = { $in: filters.language };
  }
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  if (filters.createdBy) {
    query.createdBy = filters.createdBy;
  }
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
    ];
  }
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  return await collection.countDocuments(query);
}

// ====================
// ATUALIZAÇÃO
// ====================

/**
 * Atualiza template
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<FacebookTemplate, '_id' | 'createdAt'>>
): Promise<void> {
  const collection = await getCollection('facebookTemplates');
  
  await collection.updateOne(
    { _id: new ObjectId(templateId) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Atualiza status do template
 */
export async function updateTemplateStatus(
  templateId: string,
  status: FacebookTemplate['status'],
  extra?: {
    facebookTemplateId?: string;
    rejectionReason?: string;
  }
): Promise<void> {
  const collection = await getCollection('facebookTemplates');
  
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'approved') {
    updates.approvedAt = new Date();
    if (extra?.facebookTemplateId) {
      updates.facebookTemplateId = extra.facebookTemplateId;
    }
  } else if (status === 'rejected') {
    updates.rejectedAt = new Date();
    if (extra?.rejectionReason) {
      updates.rejectionReason = extra.rejectionReason;
    }
  } else if (status === 'pending') {
    updates.submittedAt = new Date();
  }

  await collection.updateOne(
    { _id: new ObjectId(templateId) },
    { $set: updates }
  );

  console.log(`📊 Template status updated to: ${status}`);
}

// ====================
// SUBMISSÕES
// ====================

/**
 * Cria registro de submissão
 */
export async function createTemplateSubmission(
  templateId: string,
  companyId: string,
  facebookSubmissionId?: string
): Promise<string> {
  const collection = await getCollection('templateSubmissions');
  
  const submission: Omit<TemplateSubmission, '_id'> = {
    templateId,
    companyId,
    facebookSubmissionId,
    status: 'submitted',
    submittedAt: new Date(),
  };

  const result = await collection.insertOne(submission);
  
  console.log(`📤 Template submission created: ${templateId}`);
  
  return result.insertedId.toString();
}

/**
 * Atualiza status da submissão
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: TemplateSubmission['status'],
  errorMessage?: string
): Promise<void> {
  const collection = await getCollection('templateSubmissions');
  
  const updates: any = {
    status,
  };

  if (status === 'completed') {
    updates.completedAt = new Date();
  }

  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }

  await collection.updateOne(
    { _id: new ObjectId(submissionId) },
    { $set: updates }
  );
}

// ====================
// ESTATÍSTICAS
// ====================

/**
 * Calcula estatísticas de templates
 */
export async function getTemplateStats(companyId: string): Promise<TemplateStats> {
  const collection = await getCollection('facebookTemplates');
  
  // Buscar todos os templates
  const allTemplates = await collection.find({ companyId, isActive: true }).toArray();

  // Contar por status
  const byStatus = {
    draft: allTemplates.filter(t => t.status === 'draft').length,
    pending: allTemplates.filter(t => t.status === 'pending').length,
    approved: allTemplates.filter(t => t.status === 'approved').length,
    rejected: allTemplates.filter(t => t.status === 'rejected').length,
    expired: allTemplates.filter(t => t.status === 'expired').length,
  };

  // Contar por categoria
  const byCategory = {
    marketing: allTemplates.filter(t => t.category === 'marketing').length,
    utility: allTemplates.filter(t => t.category === 'utility').length,
    authentication: allTemplates.filter(t => t.category === 'authentication').length,
  };

  // Calcular taxa de aprovação
  const totalSubmitted = byStatus.approved + byStatus.rejected;
  const approvalRate = totalSubmitted > 0 ? (byStatus.approved / totalSubmitted) * 100 : 0;

  // Submissões recentes (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSubmissions = allTemplates.filter(t => 
    t.submittedAt && t.submittedAt >= sevenDaysAgo
  ).length;

  return {
    total: allTemplates.length,
    byStatus,
    byCategory,
    recentSubmissions,
    approvalRate,
  };
}

// ====================
// VALIDAÇÃO
// ====================

/**
 * Valida estrutura do template
 */
export function validateTemplate(template: Partial<FacebookTemplate>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Nome do template é obrigatório');
  }

  if (!template.category) {
    errors.push('Categoria é obrigatória');
  }

  if (!template.language || template.language.trim().length === 0) {
    errors.push('Idioma é obrigatório');
  }

  if (!template.components || template.components.length === 0) {
    errors.push('Pelo menos um componente é obrigatório');
  }

  if (template.components) {
    const hasHeader = template.components.some(c => c.type === 'HEADER');
    const hasBody = template.components.some(c => c.type === 'BODY');
    
    if (!hasHeader) {
      errors.push('Template deve ter pelo menos um componente HEADER');
    }
    
    if (!hasBody) {
      errors.push('Template deve ter pelo menos um componente BODY');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
