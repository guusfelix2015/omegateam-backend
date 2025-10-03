import { createApp } from './app.ts';
import { env } from '@/libs/env.ts';
import { AuctionService } from '@/modules/auctions/auction.service.ts';
import { AuctionRepository } from '@/modules/auctions/auction.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';

async function start() {
  let app;
  let timerCheckInterval: NodeJS.Timeout | null = null;

  try {
    // Create Fastify app
    app = await createApp();

    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`🚀 Server listening at ${address}`);
    app.log.info(`📚 API Documentation: ${address}/docs`);
    app.log.info(`🏥 Health Check: ${address}/health`);
    app.log.info(`✅ Ready Check: ${address}/ready`);
    app.log.info(`🔧 Environment: ${env.NODE_ENV}`);

    // Start auction timer check job
    const prisma = app.prisma;
    const auctionRepository = new AuctionRepository(prisma);
    const dkpRepository = new DkpRepository(prisma);
    const userRepository = new UserRepository(prisma);
    const auctionService = new AuctionService(auctionRepository, dkpRepository, userRepository);

    timerCheckInterval = setInterval(async () => {
      try {
        await auctionService.checkExpiredTimers();
      } catch (error) {
        app.log.error('Error checking expired timers:', error);
      }
    }, 1000); // Check every 1 second

    app.log.info('⏰ Auction timer check job started');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}, shutting down gracefully...`);

    // Stop timer check interval
    if (timerCheckInterval) {
      clearInterval(timerCheckInterval);
      console.log('⏰ Auction timer check job stopped');
    }

    if (app) {
      try {
        await app.close();
        console.log('✅ Server closed successfully');
      } catch (error) {
        console.error('Error during server shutdown:', error);
        process.exit(1);
      }
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

start();
