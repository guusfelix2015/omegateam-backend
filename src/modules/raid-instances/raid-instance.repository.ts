import type { PrismaClient, RaidInstance, RaidParticipant } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ValidationError } from '@/libs/errors.ts';

export interface CreateRaidInstanceData {
  raidId: string;
  createdBy: string;
  notes?: string;
}

export interface CreateRaidParticipantData {
  raidInstanceId: string;
  userId: string;
  gearScoreAtTime: number;
  dkpAwarded: number;
  classBonusApplied?: boolean;
}

export interface GetRaidInstancesOptions {
  page?: number;
  limit?: number;
  raidId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'completedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export type RaidInstanceWithRelations = Prisma.RaidInstanceGetPayload<{
  include: {
    raid: {
      select: {
        id: true;
        name: true;
        bossLevel: true;
        baseScore: true;
      };
    };
    participants: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            nickname: true;
            avatar: true;
          };
        };
      };
    };
  };
}>;

export class RaidInstanceRepository {
  constructor(private prisma: PrismaClient) { }

  async create(data: CreateRaidInstanceData): Promise<RaidInstance> {
    try {
      return await this.prisma.raidInstance.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ValidationError('Invalid raid ID');
        }
      }
      throw error;
    }
  }

  async createParticipant(data: CreateRaidParticipantData): Promise<RaidParticipant> {
    try {
      return await this.prisma.raidParticipant.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationError('User already participated in this raid instance');
        }
        if (error.code === 'P2003') {
          throw new ValidationError('Invalid raid instance or user ID');
        }
      }
      throw error;
    }
  }

  async findAll(
    options: GetRaidInstancesOptions = {}
  ): Promise<{ data: RaidInstanceWithRelations[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      raidId,
      dateFrom,
      dateTo,
      sortBy = 'completedAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.RaidInstanceWhereInput = {};

    if (raidId) {
      where.raidId = raidId;
    }

    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = dateFrom;
      if (dateTo) where.completedAt.lte = dateTo;
    }

    // Execute queries in parallel
    const [raidInstances, total] = await Promise.all([
      this.prisma.raidInstance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          raid: {
            select: {
              id: true,
              name: true,
              bossLevel: true,
              baseScore: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              dkpAwarded: 'desc',
            },
          },
        },
      }),
      this.prisma.raidInstance.count({ where }),
    ]);

    return {
      data: raidInstances,
      total,
    };
  }

  async findById(id: string): Promise<RaidInstanceWithRelations | null> {
    return this.prisma.raidInstance.findUnique({
      where: { id },
      include: {
        raid: {
          select: {
            id: true,
            name: true,
            bossLevel: true,
            baseScore: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            dkpAwarded: 'desc',
          },
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.raidInstance.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false; // Record not found
        }
      }
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.raidInstance.count({
      where: { id },
    });
    return count > 0;
  }

  async checkUserParticipation(raidInstanceId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.raidParticipant.count({
      where: {
        raidInstanceId,
        userId,
      },
    });
    return count > 0;
  }

  async getRaidInstanceStats(): Promise<{
    total: number;
    totalParticipants: number;
    averageParticipantsPerRaid: number;
    totalDkpAwarded: number;
    averageDkpPerRaid: number;
  }> {
    const [
      total,
      totalParticipants,
      totalDkpAwarded,
    ] = await Promise.all([
      this.prisma.raidInstance.count(),
      this.prisma.raidParticipant.count(),
      this.prisma.raidParticipant.aggregate({
        _sum: { dkpAwarded: true },
      }),
    ]);

    return {
      total,
      totalParticipants,
      averageParticipantsPerRaid: total > 0 ? Math.round(totalParticipants / total) : 0,
      totalDkpAwarded: totalDkpAwarded._sum.dkpAwarded || 0,
      averageDkpPerRaid: total > 0 ? Math.round((totalDkpAwarded._sum.dkpAwarded || 0) / total) : 0,
    };
  }

  async getUserRaidParticipations(userId: string): Promise<number> {
    return this.prisma.raidParticipant.count({
      where: { userId },
    });
  }

  async getRecentRaidInstances(limit: number = 5): Promise<RaidInstanceWithRelations[]> {
    return this.prisma.raidInstance.findMany({
      take: limit,
      orderBy: {
        completedAt: 'desc',
      },
      include: {
        raid: {
          select: {
            id: true,
            name: true,
            bossLevel: true,
            baseScore: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            dkpAwarded: 'desc',
          },
        },
      },
    });
  }
}
