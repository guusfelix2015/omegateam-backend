import type {
  DkpAdjustmentInput,
  DkpLeaderboardQuery,
  DkpHistoryQuery,
  DkpTransactionResponse,
  DkpLeaderboardResponse,
  DkpHistoryResponse,
  DkpStats,
  UserDkpSummary,
} from '@/routes/dkp/dkp.schema.ts';
import { DkpRepository } from './dkp.repository.ts';
import type {
  CreateDkpTransactionData,
  GetDkpHistoryOptions,
  GetDkpLeaderboardOptions,
  DkpTransactionWithRelations,
} from './dkp.types.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';
import { NotFoundError, ValidationError } from '@/libs/errors.ts';

export class DkpService {
  constructor(
    private dkpRepository: DkpRepository,
    private userRepository: UserRepository
  ) { }

  private toDkpTransactionResponse(
    transaction: DkpTransactionWithRelations
  ): DkpTransactionResponse {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      reason: transaction.reason,
      createdBy: transaction.createdBy,
      raidInstanceId: transaction.raidInstanceId,
      classBonusApplied: transaction.classBonusApplied,
      createdAt: transaction.createdAt.toISOString(),
      user: transaction.user,
      createdByUser: transaction.createdByUser,
      raidInstance: transaction.raidInstance
        ? {
          id: transaction.raidInstance.id,
          completedAt: transaction.raidInstance.completedAt.toISOString(),
          raid: transaction.raidInstance.raid,
        }
        : null,
    };
  }

  async createManualAdjustment(
    data: DkpAdjustmentInput,
    adminId: string
  ): Promise<DkpTransactionResponse> {
    // Validate that user exists
    const userExists = await this.userRepository.exists(data.userId);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    // Validate that admin exists
    const adminExists = await this.userRepository.exists(adminId);
    if (!adminExists) {
      throw new NotFoundError('Admin user');
    }

    // Get current user DKP to validate negative adjustments
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent negative DKP balance
    if (data.amount < 0 && user.dkpPoints + data.amount < 0) {
      throw new ValidationError(
        `Insufficient DKP balance. User has ${user.dkpPoints} DKP, cannot deduct ${Math.abs(data.amount)}`
      );
    }

    const transactionData: CreateDkpTransactionData = {
      userId: data.userId,
      type: 'MANUAL_ADJUSTMENT',
      amount: data.amount,
      reason: data.reason.trim(),
      createdBy: adminId,
    };

    await this.dkpRepository.createTransaction(transactionData);

    // Get the transaction with relations for response
    const { data: transactions } = await this.dkpRepository.getUserDkpHistory(
      data.userId,
      { page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }
    );

    if (transactions.length === 0) {
      throw new Error('Failed to retrieve created transaction');
    }

    const latestTransaction = transactions[0];
    if (!latestTransaction) {
      throw new Error('Failed to retrieve created transaction');
    }

    return this.toDkpTransactionResponse(latestTransaction);
  }

  async getDkpLeaderboard(
    query: Partial<DkpLeaderboardQuery> = {}
  ): Promise<DkpLeaderboardResponse> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const options: Partial<GetDkpLeaderboardOptions> = {
      page,
      limit,
      sortOrder: query.sortOrder ?? 'desc',
      search: query.search?.trim(),
    };

    const { data, total } = await this.dkpRepository.getDkpLeaderboard(options);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map(entry => ({
        id: entry.id,
        name: entry.name,
        nickname: entry.nickname,
        avatar: entry.avatar,
        dkpPoints: entry.dkpPoints,
        gearScore: entry.gearScore,
        lvl: entry.lvl,
        classe: entry.classe,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async getUserDkpHistory(
    userId: string,
    query: Partial<DkpHistoryQuery> = {}
  ): Promise<DkpHistoryResponse> {
    // Validate that user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    const options: Partial<GetDkpHistoryOptions> = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      type: query.type,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    };

    const { data, total } = await this.dkpRepository.getUserDkpHistory(
      userId,
      options
    );
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map(transaction => this.toDkpTransactionResponse(transaction)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async getUserDkpSummary(userId: string): Promise<UserDkpSummary> {
    // Validate that user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    const summary = await this.dkpRepository.getUserDkpSummary(userId);

    return {
      userId: summary.userId,
      currentDkpPoints: summary.currentDkpPoints,
      totalEarned: summary.totalEarned,
      totalSpent: summary.totalSpent,
      totalRaidRewards: summary.totalRaidRewards,
      totalManualAdjustments: summary.totalManualAdjustments,
      raidParticipations: summary.raidParticipations,
      lastActivity: summary.lastActivity?.toISOString() ?? null,
    };
  }

  async getDkpStats(): Promise<DkpStats> {
    return this.dkpRepository.getDkpStats();
  }

  async updateUserDkpBalance(userId: string, amount: number): Promise<void> {
    // This method is used internally by raid instance service
    // Validate that user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    // Get current user DKP to validate negative adjustments
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent negative DKP balance
    if (amount < 0 && user.dkpPoints + amount < 0) {
      throw new ValidationError(
        `Insufficient DKP balance. User has ${user.dkpPoints} DKP, cannot deduct ${Math.abs(amount)}`
      );
    }

    await this.userRepository.updateUserDkpBalance(userId, amount);
  }
}
