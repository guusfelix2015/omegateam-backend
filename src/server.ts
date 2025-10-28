/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createApp } from './app.ts';
import { env } from '@/libs/env.ts';
import { AuctionService } from '@/modules/auctions/auction.service.ts';
import { AuctionRepository } from '@/modules/auctions/auction.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';
import { UserInactivityService } from '@/modules/users/user-inactivity.service.ts';
import { FastifyInstance, RawServerDefault, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { IncomingMessage, ServerResponse } from 'http';

async function start() {
  let app: FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, FastifyBaseLogger, FastifyTypeProviderDefault>;
  let timerCheckInterval: NodeJS.Timeout | null = null;
  let inactivityCheckInterval: NodeJS.Timeout | null = null;

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
    const userInactivityService = new UserInactivityService(prisma);

    let cronCounter = 0;
    timerCheckInterval = setInterval(async () => {
      try {
        cronCounter++;
        // Log every 10 seconds to confirm cron is running
        if (cronCounter % 10 === 0) {
          console.log(`[CRON] Timer check job running... (${cronCounter} checks)`);
        }
        await auctionService.checkExpiredTimers();
      } catch (error) {
        app.log.error('Error checking expired timers:', error as any);
      }
    }, 1000); // Check every 1 second

    app.log.info('⏰ Auction timer check job started (checking every 1 second)');

    // Start user inactivity check job (runs daily at midnight UTC)
    // Calculate time until next midnight UTC
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule first run at midnight UTC
    setTimeout(() => {
      // Run immediately at midnight
      userInactivityService.markInactiveUsers(7).catch(error => {
        app.log.error('Error in user inactivity check:', error);
      });

      // Then run every 24 hours
      inactivityCheckInterval = setInterval(async () => {
        try {
          await userInactivityService.markInactiveUsers(7);
        } catch (error) {
          app.log.error('Error in user inactivity check:', error as any);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilMidnight);

    app.log.info(`⏰ User inactivity check job scheduled (first run in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes)`);
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

    // Stop inactivity check interval
    if (inactivityCheckInterval) {
      clearInterval(inactivityCheckInterval);
      console.log('⏰ User inactivity check job stopped');
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

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

void start();
