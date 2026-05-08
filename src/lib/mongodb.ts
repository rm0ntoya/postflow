import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI não definida nas variáveis de ambiente.");
}

// Singleton pattern: reuse connection across hot-reloads in dev
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        cached.promise = null; // reset so next request retries
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
