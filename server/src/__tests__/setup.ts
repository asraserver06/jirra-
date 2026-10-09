import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-only-access-token-secret';
process.env.JWT_REFRESH_SECRET = 'test-only-refresh-token-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

let mongo: MongoMemoryServer | null = null;

beforeAll(async () => {
  // Allow up to 120s for first-time binary download + startup
  mongo = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 120000,
    },
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri);
}, 120000);

afterEach(async () => {
  // Drop all collections between tests for full isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
}, 30000);
