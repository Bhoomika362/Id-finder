import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const DEFAULT_URI = "mongodb://127.0.0.1:27017";
const DEFAULT_DB = "fuzzy";

type Cached = {
  client: MongoClient | null;
  db: Db | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoCache: Cached | undefined;
}

const getCache = (): Cached => {
  if (!global.__mongoCache) {
    global.__mongoCache = { client: null, db: null };
  }
  return global.__mongoCache;
};

export async function getDb(): Promise<Db> {
  const cache = getCache();
  if (cache.db) return cache.db;

  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cache.client = client;
  cache.db = db;
  return db;
}

type UserDoc = { _id: ObjectId; name: string };

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection("users") as Collection<UserDoc>;
}

export { ObjectId };


