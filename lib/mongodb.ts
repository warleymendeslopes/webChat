import { Collection, Db, MongoClient } from 'mongodb';

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

async function getClient(): Promise<MongoClient> {
  if (client && clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  const options = {};

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Configure it in your environment variables.');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!(global as any)._mongoClientPromise) {
      client = new MongoClient(uri, options);
      (global as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (global as any)._mongoClientPromise as Promise<MongoClient>;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getCollection(collectionName: string): Promise<Collection> {
  const cli = await getClient();
  const dbName = process.env.MONGODB_DB || 'webChat';
  const db: Db = cli.db(dbName);
  return db.collection(collectionName);
}