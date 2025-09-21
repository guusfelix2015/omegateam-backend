import { PrismaClient, Prisma } from '@prisma/client';
import type { Raid } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/libs/errors.ts';

// Use Prisma generated types
export type RaidEntity = Raid;

export interface CreateRaidData {
  name: string;
  bossLevel: number;
  baseScore: number;
}

export interface UpdateRaidData {
  name?: string;
  bossLevel?: number;
  baseScore?: number;
  isActive?: boolean;
}

export interface GetRaidsOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'bossLevel' | 'baseScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RaidsListResult {
  data: RaidEntity[];
  total: number;
}

export class RaidRepository {
  constructor(private prisma: PrismaClient) { }

  async findAll(options: GetRaidsOptions = {}): Promise<RaidsListResult> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereConditions: Prisma.RaidWhereInput = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
      ...(isActive !== undefined && { isActive }),
    };

    // Execute queries in parallel
    const [raids, total] = await Promise.all([
      (this.prisma).raid.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      (this.prisma).raid.count({ where: whereConditions }),
    ]);

    return {
      data: raids,
      total,
    };
  }

  async findById(id: string): Promise<RaidEntity | null> {
    return this.prisma.raid.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<RaidEntity | null> {
    return this.prisma.raid.findUnique({
      where: { name },
    });
  }

  async create(data: CreateRaidData): Promise<RaidEntity> {
    try {
      return await this.prisma.raid.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.['target'] as string[];
          if (target?.includes('name')) {
            throw new ConflictError('Raid name already exists');
          }
          throw new ConflictError('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateRaidData): Promise<RaidEntity> {
    try {
      return await this.prisma.raid.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('Raid');
        }
        if (error.code === 'P2002') {
          const target = error.meta?.['target'] as string[];
          if (target?.includes('name')) {
            throw new ConflictError('Raid name already exists');
          }
          throw new ConflictError('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.raid.delete({
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

  async deactivate(id: string): Promise<RaidEntity> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<RaidEntity> {
    return this.update(id, { isActive: true });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.raid.count({
      where: { id },
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.raid.count();
  }

  async getActiveRaids(): Promise<RaidEntity[]> {
    return this.prisma.raid.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getRaidStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageBossLevel: number;
    averageBaseScore: number;
  }> {
    const [total, active, stats] = await Promise.all([
      this.prisma.raid.count(),
      this.prisma.raid.count({ where: { isActive: true } }),
      this.prisma.raid.aggregate({
        _avg: {
          bossLevel: true,
          baseScore: true,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      averageBossLevel: Math.round((stats._avg.bossLevel as number) || 0),
      averageBaseScore: Math.round((stats._avg.baseScore as number) || 0),
    };
  }
}
