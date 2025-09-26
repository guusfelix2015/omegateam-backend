import type {
  CreateRaidInstanceInput,
  GetRaidInstancesQuery,
  RaidInstanceResponse,
  RaidInstancesListResponse,
  RaidParticipantSchema,
} from '@/routes/raids/raids.schema.ts';
import {
  RaidInstanceRepository,
  type CreateRaidInstanceData,
  type CreateRaidParticipantData,
  type GetRaidInstancesOptions,
  type RaidInstanceWithRelations,
} from './raid-instance.repository.ts';
import { RaidRepository } from '@/modules/raids/raid.repository.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { DkpCalculationService } from '@/modules/dkp/dkp-calculation.service.ts';
import { NotFoundError, ValidationError } from '@/libs/errors.ts';
import type { PrismaClient } from '@prisma/client';

export class RaidInstanceService {
  private dkpCalculationService: DkpCalculationService;

  constructor(
    private prisma: PrismaClient,
    private raidInstanceRepository: RaidInstanceRepository,
    private raidRepository: RaidRepository,
    private userRepository: UserRepository,
    private dkpRepository: DkpRepository
  ) {
    this.dkpCalculationService = new DkpCalculationService();
  }

  private toRaidInstanceResponse(
    raidInstance: RaidInstanceWithRelations
  ): RaidInstanceResponse {
    return {
      id: raidInstance.id,
      raidId: raidInstance.raidId,
      completedAt: raidInstance.completedAt.toISOString(),
      createdBy: raidInstance.createdBy,
      notes: raidInstance.notes,
      createdAt: raidInstance.createdAt.toISOString(),
      raid: {
        id: raidInstance.raid.id,
        name: raidInstance.raid.name,
        bossLevel: raidInstance.raid.bossLevel,
        baseScore: raidInstance.raid.baseScore,
        isActive: true, // We only allow creating instances for active raids
        createdAt: '', // Not needed for this response
        updatedAt: '', // Not needed for this response
      },
      participants: raidInstance.participants.map((participant): RaidParticipantSchema => ({
        id: participant.id,
        raidInstanceId: participant.raidInstanceId,
        userId: participant.userId,
        gearScoreAtTime: participant.gearScoreAtTime,
        dkpAwarded: participant.dkpAwarded,
        createdAt: participant.createdAt.toISOString(),
        user: participant.user,
      })),
    };
  }

  async createRaidInstance(
    data: CreateRaidInstanceInput,
    adminId: string
  ): Promise<RaidInstanceResponse> {
    // Validate that raid exists and is active
    const raid = await this.raidRepository.findById(data.raidId);
    if (!raid) {
      throw new NotFoundError('Raid');
    }

    if (!raid.isActive) {
      throw new ValidationError('Cannot create instance for inactive raid');
    }

    // Validate that all participants exist and are active
    const participants = await Promise.all(
      data.participantIds.map(async (userId) => {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new NotFoundError(`User with ID ${userId}`);
        }
        if (!user.isActive) {
          throw new ValidationError(`User ${user.nickname} is not active`);
        }
        return user;
      })
    );

    // Remove duplicates from participant IDs
    const uniqueParticipantIds = [...new Set(data.participantIds)];
    if (uniqueParticipantIds.length !== data.participantIds.length) {
      throw new ValidationError('Duplicate participants are not allowed');
    }

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async () => {
      // Create raid instance
      const raidInstanceData: CreateRaidInstanceData = {
        raidId: data.raidId,
        createdBy: adminId,
        notes: data.notes?.trim(),
      };

      const raidInstance = await this.raidInstanceRepository.create(raidInstanceData);

      // Calculate DKP for each participant and create participant records
      const participantPromises = participants.map(async (user) => {
        const dkpAwarded = this.dkpCalculationService.calculateDkpForParticipant(
          raid.bossLevel,
          user.gearScore
        );

        // Create participant record
        const participantData: CreateRaidParticipantData = {
          raidInstanceId: raidInstance.id,
          userId: user.id,
          gearScoreAtTime: user.gearScore,
          dkpAwarded,
        };

        await this.raidInstanceRepository.createParticipant(participantData);

        // Create DKP transaction
        await this.dkpRepository.createTransaction({
          userId: user.id,
          type: 'RAID_REWARD',
          amount: dkpAwarded,
          reason: `Raid completion: ${raid.name}`,
          createdBy: adminId,
          raidInstanceId: raidInstance.id,
        });

        return {
          userId: user.id,
          dkpAwarded,
        };
      });

      await Promise.all(participantPromises);

      // Get the created raid instance with all relations
      const createdRaidInstance = await this.raidInstanceRepository.findById(
        raidInstance.id
      );

      if (!createdRaidInstance) {
        throw new Error('Failed to retrieve created raid instance');
      }

      return this.toRaidInstanceResponse(createdRaidInstance);
    });
  }

  async getRaidInstances(
    query: Partial<GetRaidInstancesQuery> = {}
  ): Promise<RaidInstancesListResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'completedAt',
      sortOrder = 'desc',
      raidId,
      dateFrom,
      dateTo,
    } = query;

    const options: GetRaidInstancesOptions = {
      page,
      limit,
      raidId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      sortBy,
      sortOrder,
    };

    const { data, total } = await this.raidInstanceRepository.findAll(options);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map(raidInstance => this.toRaidInstanceResponse(raidInstance)),
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

  async getRaidInstanceById(id: string): Promise<RaidInstanceResponse> {
    const raidInstance = await this.raidInstanceRepository.findById(id);
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    return this.toRaidInstanceResponse(raidInstance);
  }

  async deleteRaidInstance(id: string): Promise<void> {
    const success = await this.raidInstanceRepository.delete(id);
    if (!success) {
      throw new NotFoundError('Raid instance');
    }
  }

  async getRaidInstanceStats(): Promise<{
    total: number;
    totalParticipants: number;
    averageParticipantsPerRaid: number;
    totalDkpAwarded: number;
    averageDkpPerRaid: number;
  }> {
    return this.raidInstanceRepository.getRaidInstanceStats();
  }

  async getRecentRaidInstances(limit: number = 5): Promise<RaidInstanceResponse[]> {
    const raidInstances = await this.raidInstanceRepository.getRecentRaidInstances(limit);
    return raidInstances.map(raidInstance => this.toRaidInstanceResponse(raidInstance));
  }

  async addParticipant(
    raidInstanceId: string,
    userId: string,
    adminId: string
  ): Promise<RaidParticipantSchema> {
    // Validate that raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(raidInstanceId);
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    // Validate that user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    if (!user.isActive) {
      throw new ValidationError(`User ${user.nickname} is not active`);
    }

    // Check if user is already a participant
    const isAlreadyParticipant = await this.raidInstanceRepository.checkUserParticipation(
      raidInstanceId,
      userId
    );
    if (isAlreadyParticipant) {
      throw new ValidationError('User is already a participant in this raid instance');
    }

    // Get raid details for DKP calculation
    const raid = await this.raidRepository.findById(raidInstance.raidId);
    if (!raid) {
      throw new NotFoundError('Raid');
    }

    // Calculate DKP for the participant
    const dkpAwarded = this.dkpCalculationService.calculateDkpForParticipant(
      raid.bossLevel,
      user.gearScore
    );

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async () => {
      // Create participant record
      const participantData: CreateRaidParticipantData = {
        raidInstanceId,
        userId,
        gearScoreAtTime: user.gearScore,
        dkpAwarded,
      };

      await this.raidInstanceRepository.createParticipant(participantData);

      // Create DKP transaction
      await this.dkpRepository.createTransaction({
        userId,
        type: 'RAID_REWARD',
        amount: dkpAwarded,
        reason: `Raid completion: ${raid.name}`,
        createdBy: adminId,
        raidInstanceId,
      });

      return {
        id: '', // Will be set by the database
        raidInstanceId,
        userId,
        gearScoreAtTime: user.gearScore,
        dkpAwarded,
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      };
    });
  }

  async removeParticipant(raidInstanceId: string, userId: string): Promise<void> {
    // Validate that raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(raidInstanceId);
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    // Check if user is a participant
    const isParticipant = await this.raidInstanceRepository.checkUserParticipation(
      raidInstanceId,
      userId
    );
    if (!isParticipant) {
      throw new ValidationError('User is not a participant in this raid instance');
    }

    // Use transaction to ensure data consistency
    await this.prisma.$transaction(async () => {
      // Remove participant record
      await this.prisma.raidParticipant.deleteMany({
        where: {
          raidInstanceId,
          userId,
        },
      });

      // Remove associated DKP transaction
      await this.prisma.dkpTransaction.deleteMany({
        where: {
          raidInstanceId,
          userId,
          type: 'RAID_REWARD',
        },
      });
    });
  }

  async previewDkpCalculation(
    raidId: string,
    participantIds: string[]
  ): Promise<{
    totalDkpToAward: number;
    averageDkpPerParticipant: number;
    participants: Array<{
      userId: string;
      name: string;
      gearScore: number;
      dkpAwarded: number;
    }>;
  }> {
    // Validate that raid exists
    const raid = await this.raidRepository.findById(raidId);
    if (!raid) {
      throw new NotFoundError('Raid');
    }

    // Get participant details
    const participants = await Promise.all(
      participantIds.map(async (userId) => {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new NotFoundError(`User with ID ${userId}`);
        }
        return {
          userId: user.id,
          name: user.name,
          gearScore: user.gearScore,
        };
      })
    );

    return this.dkpCalculationService.previewDkpCalculation(
      raid.bossLevel,
      participants
    );
  }
}
