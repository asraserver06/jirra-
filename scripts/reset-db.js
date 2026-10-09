import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
dotenv.config({ path: fileURLToPath(new URL('../server/.env', import.meta.url)) });

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed when NODE_ENV is production.');
  }

  if (!process.argv.includes('--confirm')) {
    throw new Error('Refusing to reset the database without the --confirm flag.');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI must be configured before resetting the database.');
  }

  await mongoose.connect(uri);
  try {
    await mongoose.connection.dropDatabase();
    console.log('Database reset complete: all collections were dropped.');
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Database reset failed: ${message}`);
  process.exitCode = 1;
});
