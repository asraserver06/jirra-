import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  await connectDB();

  const app = createApp();

  const server = app.listen(ENV.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Jira Express REST API Server running on port ${ENV.PORT}`);
    console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
    console.log(`🩺 Health: http://localhost:${ENV.PORT}/api/health`);
    console.log(`🌱 Seed: npm run seed (to populate realistic dataset)`);
    console.log(`===============================================`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully...');
    server.close(() => {
      console.log('Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
