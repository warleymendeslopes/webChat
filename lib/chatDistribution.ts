import { ChatAssignment, ChatAssignmentStatus, DistributionStrategy } from '@/types/admin';
import { getCollection } from './mongodb';
import { getUsersByRole } from './mongodb-users';

/**
 * Sistema de Distribuição de Chats
 * Gerencia a atribuição automática de chats para atendentes disponíveis
 */

// ====================
// CRIAÇÃO E BUSCA
// ====================

/**
 * Cria uma nova atribuição de chat
 */
export async function createChatAssignment(
  chatId: string,
  companyId: string,
  lastCustomerMessageAt?: Date
): Promise<string> {
  const collection = await getCollection('chatAssignments');
  
  const assignment: Omit<ChatAssignment, '_id'> = {
    chatId,
    companyId,
    assignedTo: null,
    status: 'new',
    lastActivityAt: new Date(),
    lastCustomerMessageAt: lastCustomerMessageAt || new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(assignment);
  return result.insertedId.toString();
}

/**
 * Busca atribuição de chat existente
 */
export async function getChatAssignment(chatId: string): Promise<ChatAssignment | null> {
  const collection = await getCollection('chatAssignments');
  const assignment = await collection.findOne({ chatId });
  
  if (!assignment) return null;
  
  return {
    ...assignment,
    _id: assignment._id.toString(),
  } as ChatAssignment;
}

/**
 * Busca ou cria uma atribuição de chat
 */
export async function getOrCreateChatAssignment(
  chatId: string,
  companyId: string,
  lastCustomerMessageAt?: Date
): Promise<ChatAssignment> {
  let assignment = await getChatAssignment(chatId);
  
  if (!assignment) {
    const id = await createChatAssignment(chatId, companyId, lastCustomerMessageAt);
    assignment = await getChatAssignment(chatId);
  }
  
  if (!assignment) {
    throw new Error('Failed to create or retrieve chat assignment');
  }
  
  return assignment;
}

// ====================
// DISTRIBUIÇÃO
// ====================

/**
 * Interface para atendente com sua carga de trabalho
 */
interface AttendantLoad {
  userId: string;
  activeChats: number;
  maxChats: number;
  isAvailable: boolean;
}

/**
 * Busca atendentes disponíveis com suas cargas de trabalho
 */
async function getAttendantsWithLoad(companyId: string): Promise<AttendantLoad[]> {
  // Buscar todos atendentes ativos da empresa
  const attendants = await getUsersByRole('attendant', companyId);
  const activeAttendants = attendants.filter(a => a.isActive);
  
  if (activeAttendants.length === 0) {
    return [];
  }

  // Buscar status de cada atendente
  const statusCollection = await getCollection('attendantStatus');
  const assignmentCollection = await getCollection('chatAssignments');

  const loads: AttendantLoad[] = [];

  for (const attendant of activeAttendants) {
    // Buscar status do atendente
    const status = await statusCollection.findOne({ userId: attendant._id });
    
    // Contar chats ativos atribuídos a este atendente
    const activeChats = await assignmentCollection.countDocuments({
      assignedTo: attendant._id,
      companyId,
      status: { $in: ['assigned', 'active'] }
    });

    const maxChats = status?.maxChats || 10; // Default 10 chats simultâneos
    const statusType = status?.status || 'available';

    loads.push({
      userId: attendant._id,
      activeChats,
      maxChats,
      isAvailable: statusType === 'available' && activeChats < maxChats,
    });
  }

  return loads;
}

/**
 * Seleciona o melhor atendente com base na estratégia
 */
function selectBestAttendant(
  loads: AttendantLoad[],
  strategy: DistributionStrategy = 'least_active'
): string | null {
  // Filtrar apenas disponíveis
  const available = loads.filter(l => l.isAvailable);
  
  if (available.length === 0) {
    return null;
  }

  switch (strategy) {
    case 'least_active':
      // Seleciona o atendente com menos chats ativos
      available.sort((a, b) => a.activeChats - b.activeChats);
      return available[0].userId;

    case 'balanced':
      // Seleciona considerando a capacidade (% de utilização)
      available.sort((a, b) => {
        const aUtilization = a.activeChats / a.maxChats;
        const bUtilization = b.activeChats / b.maxChats;
        return aUtilization - bUtilization;
      });
      return available[0].userId;

    case 'round_robin':
      // Seleciona o primeiro disponível (pode ser melhorado com tracking)
      return available[0].userId;

    default:
      return available[0].userId;
  }
}

/**
 * Atribui um chat a um atendente específico
 */
export async function assignChatToAttendant(
  chatId: string,
  attendantId: string
): Promise<void> {
  const collection = await getCollection('chatAssignments');
  
  await collection.updateOne(
    { chatId },
    {
      $set: {
        assignedTo: attendantId,
        status: 'assigned' as ChatAssignmentStatus,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  // Atualizar contador de chats ativos do atendente
  await updateAttendantActiveChatsCount(attendantId);
}

/**
 * Distribui automaticamente um chat para um atendente disponível
 */
export async function distributeChat(
  chatId: string,
  companyId: string,
  strategy: DistributionStrategy = 'least_active'
): Promise<string | null> {
  // Buscar atendentes com suas cargas
  const loads = await getAttendantsWithLoad(companyId);
  
  // Selecionar o melhor atendente
  const selectedAttendant = selectBestAttendant(loads, strategy);
  
  if (!selectedAttendant) {
    console.warn(`No available attendant for company ${companyId}`);
    return null;
  }

  // Atribuir o chat
  await assignChatToAttendant(chatId, selectedAttendant);
  
  console.log(`✅ Chat ${chatId} assigned to attendant ${selectedAttendant}`);
  
  return selectedAttendant;
}

// ====================
// ATUALIZAÇÃO DE STATUS
// ====================

/**
 * Atualiza a atividade de um chat
 */
export async function updateChatActivity(
  chatId: string,
  isFromCustomer: boolean = false
): Promise<void> {
  const collection = await getCollection('chatAssignments');
  
  const update: any = {
    lastActivityAt: new Date(),
    updatedAt: new Date(),
  };

  if (isFromCustomer) {
    update.lastCustomerMessageAt = new Date();
    // Se estava expirado e cliente mandou mensagem, reabrir
    update.status = 'active';
  } else {
    update.lastAttendantMessageAt = new Date();
    // Marcar como ativo se estava apenas atribuído
    update.status = 'active';
  }

  await collection.updateOne({ chatId }, { $set: update });
}

/**
 * Atualiza o contador de chats ativos de um atendente
 */
async function updateAttendantActiveChatsCount(attendantId: string): Promise<void> {
  const assignmentCollection = await getCollection('chatAssignments');
  const statusCollection = await getCollection('attendantStatus');

  // Contar chats ativos
  const activeCount = await assignmentCollection.countDocuments({
    assignedTo: attendantId,
    status: { $in: ['assigned', 'active'] }
  });

  // Atualizar status do atendente
  await statusCollection.updateOne(
    { userId: attendantId },
    {
      $set: {
        activeChats: activeCount,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Libera um chat (remove atribuição)
 */
export async function unassignChat(chatId: string): Promise<void> {
  const collection = await getCollection('chatAssignments');
  
  const assignment = await getChatAssignment(chatId);
  const oldAttendantId = assignment?.assignedTo;

  await collection.updateOne(
    { chatId },
    {
      $set: {
        assignedTo: null,
        status: 'new' as ChatAssignmentStatus,
        updatedAt: new Date(),
      },
    }
  );

  // Atualizar contador do atendente anterior
  if (oldAttendantId) {
    await updateAttendantActiveChatsCount(oldAttendantId);
  }
}

/**
 * Marca um chat como resolvido
 */
export async function resolveChatAssignment(chatId: string): Promise<void> {
  const collection = await getCollection('chatAssignments');
  
  const assignment = await getChatAssignment(chatId);
  const attendantId = assignment?.assignedTo;

  await collection.updateOne(
    { chatId },
    {
      $set: {
        status: 'resolved' as ChatAssignmentStatus,
        updatedAt: new Date(),
      },
    }
  );

  // Atualizar contador do atendente
  if (attendantId) {
    await updateAttendantActiveChatsCount(attendantId);
  }
}

// ====================
// JANELA DE 24H
// ====================

/**
 * Verifica se o chat está dentro da janela de 24h
 */
export async function isWithin24HourWindow(chatId: string): Promise<boolean> {
  const assignment = await getChatAssignment(chatId);
  
  if (!assignment || !assignment.lastCustomerMessageAt) {
    return false;
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return assignment.lastCustomerMessageAt > twentyFourHoursAgo;
}

/**
 * Busca chats com janela expirada
 */
export async function getExpiredChats(companyId: string): Promise<ChatAssignment[]> {
  const collection = await getCollection('chatAssignments');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expired = await collection.find({
    companyId,
    status: { $in: ['assigned', 'active'] },
    lastCustomerMessageAt: { $lt: twentyFourHoursAgo },
  }).toArray();

  return expired.map(a => ({
    ...a,
    _id: a._id.toString(),
  })) as ChatAssignment[];
}

/**
 * Marca chats expirados
 */
export async function markExpiredChats(companyId: string): Promise<number> {
  const collection = await getCollection('chatAssignments');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await collection.updateMany(
    {
      companyId,
      status: { $in: ['assigned', 'active'] },
      lastCustomerMessageAt: { $lt: twentyFourHoursAgo },
    },
    {
      $set: {
        status: 'expired' as ChatAssignmentStatus,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
}

// ====================
// REATRIBUIÇÃO
// ====================

/**
 * Busca chats inativos que precisam ser reatribuídos
 */
export async function getInactiveAssignments(
  companyId: string,
  inactiveHours: number = 24
): Promise<ChatAssignment[]> {
  const collection = await getCollection('chatAssignments');
  const cutoffTime = new Date(Date.now() - inactiveHours * 60 * 60 * 1000);

  const inactive = await collection.find({
    companyId,
    status: { $in: ['assigned', 'active'] },
    assignedTo: { $ne: null },
    lastActivityAt: { $lt: cutoffTime },
  }).toArray();

  return inactive.map(a => ({
    ...a,
    _id: a._id.toString(),
  })) as ChatAssignment[];
}

/**
 * Reatribui chats inativos
 */
export async function reassignInactiveChats(
  companyId: string,
  inactiveHours: number = 24
): Promise<number> {
  const inactive = await getInactiveAssignments(companyId, inactiveHours);
  let reassignedCount = 0;

  for (const assignment of inactive) {
    // Liberar chat
    await unassignChat(assignment.chatId);
    
    // Tentar redistribuir
    const newAttendant = await distributeChat(assignment.chatId, companyId);
    
    if (newAttendant) {
      reassignedCount++;
      console.log(`🔄 Chat ${assignment.chatId} reassigned from ${assignment.assignedTo} to ${newAttendant}`);
    }
  }

  return reassignedCount;
}

// ====================
// BUSCA E LISTAGEM
// ====================

/**
 * Busca chats atribuídos a um atendente
 */
export async function getAttendantAssignments(
  attendantId: string,
  companyId: string
): Promise<ChatAssignment[]> {
  const collection = await getCollection('chatAssignments');
  
  const assignments = await collection.find({
    assignedTo: attendantId,
    companyId,
    status: { $in: ['assigned', 'active'] }
  }).toArray();

  return assignments.map(a => ({
    ...a,
    _id: a._id.toString(),
  })) as ChatAssignment[];
}

/**
 * Busca chats não atribuídos (fila)
 */
export async function getUnassignedChats(companyId: string): Promise<ChatAssignment[]> {
  const collection = await getCollection('chatAssignments');
  
  const unassigned = await collection.find({
    companyId,
    assignedTo: null,
    status: 'new'
  }).toArray();

  return unassigned.map(a => ({
    ...a,
    _id: a._id.toString(),
  })) as ChatAssignment[];
}

