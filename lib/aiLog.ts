import { getCollection } from './mongodb';

export interface AiLogEntry {
  companyId: string;
  chatId: string;
  customerPhone: string;
  inboundMessage: string;
  aiMessage?: string;
  confidence?: number;
  action?: 'reply' | 'handoff_human' | 'skip';
  error?: string;
  createdAt: Date;
  meta?: Record<string, any>;
}

export async function writeAiLog(entry: Omit<AiLogEntry, 'createdAt'>) {
  const collection = await getCollection('aiLogs');
  const doc: AiLogEntry = { ...entry, createdAt: new Date() };
  await collection.insertOne(doc as any);
}

export async function listAiLogs(companyId: string, limit = 50) {
  const collection = await getCollection('aiLogs');
  const cursor = collection
    .find({ companyId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return cursor.toArray();
}
