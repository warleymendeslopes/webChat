import { AttendantStatus, AttendantStatusType } from '@/types/admin';
import { getCollection } from './mongodb';

/**
 * Sistema de Gerenciamento de Status de Atendentes
 * Controla disponibilidade, carga de trabalho e atividade dos atendentes
 */

// ====================
// CRIAÇÃO E BUSCA
// ====================

/**
 * Cria ou atualiza o status de um atendente
 */
export async function upsertAttendantStatus(
  userId: string,
  companyId: string,
  status: AttendantStatusType = 'offline',
  maxChats: number = 10
): Promise<string> {
  const collection = await getCollection('attendantStatus');

  const existingStatus = await collection.findOne({ userId, companyId });

  if (existingStatus) {
    await collection.updateOne(
      { userId, companyId },
      {
        $set: {
          status,
          maxChats,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    return existingStatus._id.toString();
  } else {
    const result = await collection.insertOne({
      userId,
      companyId,
      status,
      activeChats: 0,
      maxChats,
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId.toString();
  }
}

/**
 * Busca o status de um atendente
 */
export async function getAttendantStatus(
  userId: string,
  companyId: string
): Promise<AttendantStatus | null> {
  const collection = await getCollection('attendantStatus');
  const status = await collection.findOne({ userId, companyId });

  if (!status) return null;

  return {
    ...status,
    _id: status._id.toString(),
  } as AttendantStatus;
}

/**
 * Busca todos os status dos atendentes de uma empresa
 */
export async function getAllAttendantStatuses(
  companyId: string
): Promise<AttendantStatus[]> {
  const collection = await getCollection('attendantStatus');
  const statuses = await collection.find({ companyId }).toArray();

  return statuses.map(s => ({
    ...s,
    _id: s._id.toString(),
  })) as AttendantStatus[];
}

// ====================
// ATUALIZAÇÃO DE STATUS
// ====================

/**
 * Atualiza o status de um atendente
 */
export async function updateAttendantStatusType(
  userId: string,
  companyId: string,
  status: AttendantStatusType
): Promise<void> {
  const collection = await getCollection('attendantStatus');

  await collection.updateOne(
    { userId, companyId },
    {
      $set: {
        status,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log(`📊 Attendant ${userId} status updated to: ${status}`);
}

/**
 * Marca atendente como disponível
 */
export async function setAttendantAvailable(
  userId: string,
  companyId: string
): Promise<void> {
  await updateAttendantStatusType(userId, companyId, 'available');
}

/**
 * Marca atendente como ocupado
 */
export async function setAttendantBusy(
  userId: string,
  companyId: string
): Promise<void> {
  await updateAttendantStatusType(userId, companyId, 'busy');
}

/**
 * Marca atendente como ausente
 */
export async function setAttendantAway(
  userId: string,
  companyId: string
): Promise<void> {
  await updateAttendantStatusType(userId, companyId, 'away');
}

/**
 * Marca atendente como offline
 */
export async function setAttendantOffline(
  userId: string,
  companyId: string
): Promise<void> {
  await updateAttendantStatusType(userId, companyId, 'offline');
}

// ====================
// ATUALIZAÇÃO DE CARGA
// ====================

/**
 * Atualiza o contador de chats ativos do atendente
 */
export async function updateAttendantActiveChats(
  userId: string,
  companyId: string,
  activeChats: number
): Promise<void> {
  const collection = await getCollection('attendantStatus');

  await collection.updateOne(
    { userId, companyId },
    {
      $set: {
        activeChats,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Incrementa o contador de chats ativos
 */
export async function incrementActiveChats(
  userId: string,
  companyId: string
): Promise<void> {
  const collection = await getCollection('attendantStatus');

  await collection.updateOne(
    { userId, companyId },
    {
      $inc: { activeChats: 1 },
      $set: {
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Auto-ajustar status se atingir limite
  await autoAdjustStatus(userId, companyId);
}

/**
 * Decrementa o contador de chats ativos
 */
export async function decrementActiveChats(
  userId: string,
  companyId: string
): Promise<void> {
  const collection = await getCollection('attendantStatus');

  await collection.updateOne(
    { userId, companyId },
    {
      $inc: { activeChats: -1 },
      $set: {
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  // Garantir que não fique negativo
  await collection.updateOne(
    { userId, companyId, activeChats: { $lt: 0 } },
    { $set: { activeChats: 0 } }
  );

  // Auto-ajustar status se liberou capacidade
  await autoAdjustStatus(userId, companyId);
}

/**
 * Ajusta automaticamente o status baseado na carga
 */
async function autoAdjustStatus(
  userId: string,
  companyId: string
): Promise<void> {
  const status = await getAttendantStatus(userId, companyId);
  
  if (!status) return;

  // Se estava busy mas agora tem capacidade, voltar para available
  if (status.status === 'busy' && status.activeChats < status.maxChats) {
    await setAttendantAvailable(userId, companyId);
  }
  
  // Se atingiu o limite, marcar como busy
  if (status.status === 'available' && status.activeChats >= status.maxChats) {
    await setAttendantBusy(userId, companyId);
  }
}

// ====================
// CONFIGURAÇÃO
// ====================

/**
 * Define o número máximo de chats simultâneos
 */
export async function setMaxChats(
  userId: string,
  companyId: string,
  maxChats: number
): Promise<void> {
  const collection = await getCollection('attendantStatus');

  await collection.updateOne(
    { userId, companyId },
    {
      $set: {
        maxChats,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Reajustar status se necessário
  await autoAdjustStatus(userId, companyId);
}

// ====================
// ATIVIDADE E HEARTBEAT
// ====================

/**
 * Atualiza o timestamp de última atividade
 */
export async function updateAttendantActivity(
  userId: string,
  companyId: string
): Promise<void> {
  const collection = await getCollection('attendantStatus');

  await collection.updateOne(
    { userId, companyId },
    {
      $set: {
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Marca atendentes inativos como offline
 * Deve ser executado periodicamente (ex: a cada 5 minutos)
 */
export async function markInactiveAttendantsAsOffline(
  companyId: string,
  inactiveMinutes: number = 10
): Promise<number> {
  const collection = await getCollection('attendantStatus');
  const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);

  const result = await collection.updateMany(
    {
      companyId,
      status: { $ne: 'offline' },
      lastActivityAt: { $lt: cutoffTime },
    },
    {
      $set: {
        status: 'offline' as AttendantStatusType,
        updatedAt: new Date(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`🔴 Marked ${result.modifiedCount} inactive attendants as offline`);
  }

  return result.modifiedCount;
}

// ====================
// ESTATÍSTICAS
// ====================

/**
 * Busca atendentes disponíveis para receber novos chats
 */
export async function getAvailableAttendants(
  companyId: string
): Promise<AttendantStatus[]> {
  const collection = await getCollection('attendantStatus');

  const available = await collection.find({
    companyId,
    status: 'available',
    $expr: { $lt: ['$activeChats', '$maxChats'] }
  }).toArray();

  return available.map(s => ({
    ...s,
    _id: s._id.toString(),
  })) as AttendantStatus[];
}

/**
 * Conta atendentes por status
 */
export async function countAttendantsByStatus(
  companyId: string
): Promise<Record<AttendantStatusType, number>> {
  const collection = await getCollection('attendantStatus');

  const statuses = await collection.find({ companyId }).toArray();

  const counts: Record<AttendantStatusType, number> = {
    available: 0,
    busy: 0,
    away: 0,
    offline: 0,
  };

  for (const status of statuses) {
    counts[status.status as AttendantStatusType]++;
  }

  return counts;
}

/**
 * Calcula carga média dos atendentes
 */
export async function getAverageLoad(companyId: string): Promise<number> {
  const collection = await getCollection('attendantStatus');

  const statuses = await collection.find({
    companyId,
    status: { $ne: 'offline' }
  }).toArray();

  if (statuses.length === 0) return 0;

  const totalLoad = statuses.reduce((sum, s) => {
    const utilization = s.maxChats > 0 ? (s.activeChats / s.maxChats) : 0;
    return sum + utilization;
  }, 0);

  return totalLoad / statuses.length;
}

/**
 * Busca o atendente com menor carga
 */
export async function getLeastLoadedAttendant(
  companyId: string
): Promise<AttendantStatus | null> {
  const available = await getAvailableAttendants(companyId);

  if (available.length === 0) return null;

  // Ordenar por utilização (activeChats / maxChats)
  available.sort((a, b) => {
    const aUtil = a.activeChats / a.maxChats;
    const bUtil = b.activeChats / b.maxChats;
    return aUtil - bUtil;
  });

  return available[0];
}

// ====================
// INICIALIZAÇÃO
// ====================

/**
 * Inicializa o status de um atendente quando ele faz login
 */
export async function initializeAttendantStatus(
  userId: string,
  companyId: string,
  maxChats: number = 10
): Promise<void> {
  await upsertAttendantStatus(userId, companyId, 'available', maxChats);
  console.log(`✅ Attendant ${userId} initialized with status 'available'`);
}

/**
 * Limpa o status de um atendente quando ele faz logout
 */
export async function cleanupAttendantStatus(
  userId: string,
  companyId: string
): Promise<void> {
  await setAttendantOffline(userId, companyId);
  console.log(`🔴 Attendant ${userId} marked as offline`);
}

