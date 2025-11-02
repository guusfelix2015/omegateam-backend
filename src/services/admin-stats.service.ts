import { PrismaClient } from '@prisma/client';
import {
  AdminStatsRepository,
  UserAnalyticsFilters,
  RaidAnalyticsFilters,
  DkpAnalyticsFilters,
} from '../repositories/admin-stats.repository';

export class AdminStatsService {
  private repository: AdminStatsRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new AdminStatsRepository(prisma);
  }

  async getOverviewStats() {
    return this.repository.getOverviewStats();
  }

  async getUserAnalytics(filters: UserAnalyticsFilters) {
    return this.repository.getUserAnalytics(filters);
  }

  async getRaidAnalytics(filters: RaidAnalyticsFilters) {
    return this.repository.getRaidAnalytics(filters);
  }

  async getDkpAnalytics(filters: DkpAnalyticsFilters) {
    return this.repository.getDkpAnalytics(filters);
  }

  async getCompanyPartyStats() {
    return this.repository.getCompanyPartyStats();
  }

  async getActivityFeed(limit?: number) {
    return this.repository.getActivityFeed(limit);
  }
}
