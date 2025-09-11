import {createApp} from './app.js';
import {env} from '@/libs/env.js';

async function start() {
  let app;

  try {
    // Create Fastify app
    app = await createApp();

    // Start server
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`🚀 Server listening at ${address}`);
    app.log.info(`📚 API Documentation: ${address}/docs`);
    app.log.info(`🏥 Health Check: ${address}/health`);
    app.log.info(`✅ Ready Check: ${address}/ready`);
    app.log.info(`🔧 Environment: ${env.NODE_ENV}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}, shutting down gracefully...`);

    if (app) {
      try {
        await app.close();
        console.log('✅ Server closed successfully');
      } catch (error) {
        console.error('❌ Error during server shutdown:', error);
        process.exit(1);
      }
    }

    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Start the server
start();
