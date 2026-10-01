import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env.js';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    // If user provided a custom MONGODB_URI (e.g. MongoDB Atlas)
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://127.0.0.1:27017/jira-app') {
      console.log(`📡 Connecting to provided MongoDB URI: ${process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected successfully to remote MongoDB Atlas database!');
      return;
    }

    // Try default local connection first
    try {
      await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
      console.log('✅ Connected successfully to local MongoDB!');
      return;
    } catch {
      console.log('⚠️ Local MongoDB not detected. Bootstrapping embedded In-Memory MongoDB engine...');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('🚀 Embedded In-Memory MongoDB connected! (Ready for instant use)');
      console.log('💡 Tip: Provide your MongoDB Atlas URL in .env as MONGODB_URI to persist to cloud.');
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};
