import type { PrismaClient, RaidDroppedItem, ItemCategory, ItemGrade } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ValidationError } from '@/libs/errors.ts';

export interface CreateRaidDroppedItemData {
  name: string;
  category: ItemCategory;
  grade: ItemGrade;
  minDkpBid: number;
  raidInstanceId: string;
  createdBy: string;
  notes?: string;
}

export interface UpdateRaidDroppedItemData {
  name?: string;
  category?: ItemCategory;
  grade?: ItemGrade;
  minDkpBid?: number;
  notes?: string;
}

export interface GetRaidDroppedItemsOptions {
  page?: number;
  limit?: number;
  raidInstanceId?: string;
  category?: ItemCategory;
  grade?: ItemGrade;
  sortBy?: 'droppedAt' | 'name' | 'minDkpBid';
  sortOrder?: 'asc' | 'desc';
}

export type RaidDroppedItemWithRelations = Prisma.RaidDroppedItemGetPayload<{
  include: {
    raidInstance: {
      include: {
        raid: {
          select: {
            id: true;
            name: true;
            bossLevel: true;
          };
        };
      };
    };
  };
}>;

export class RaidDroppedItemRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateRaidDroppedItemData): Promise<RaidDroppedItem> {
    try {
      return await this.prisma.raidDroppedItem.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ValidationError('Invalid raid instance ID');
        }
      }
      throw error;
    }
  }

  async findAll(options: GetRaidDroppedItemsOptions = {}): Promise<{
    data: RaidDroppedItemWithRelations[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      raidInstanceId,
      category,
      grade,
      sortBy = 'droppedAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.RaidDroppedItemWhereInput = {};

    if (raidInstanceId) {
      where.raidInstanceId = raidInstanceId;
    }

    if (category) {
      where.category = category;
    }

    if (grade) {
      where.grade = grade;
    }

    // Execute queries in parallel
    const [droppedItems, total] = await Promise.all([
      this.prisma.raidDroppedItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          raidInstance: {
            include: {
              raid: {
                select: {
                  id: true,
                  name: true,
                  bossLevel: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.raidDroppedItem.count({ where }),
    ]);

    return {
      data: droppedItems,
      total,
    };
  }

  async findById(id: string): Promise<RaidDroppedItemWithRelations | null> {
    return this.prisma.raidDroppedItem.findUnique({
      where: { id },
      include: {
        raidInstance: {
          include: {
            raid: {
              select: {
                id: true,
                name: true,
                bossLevel: true,
              },
            },
          },
        },
      },
    });
  }

  async findByRaidInstanceId(raidInstanceId: string): Promise<RaidDroppedItem[]> {
    return this.prisma.raidDroppedItem.findMany({
      where: { raidInstanceId },
      orderBy: { droppedAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateRaidDroppedItemData): Promise<RaidDroppedItem | null> {
    try {
      return await this.prisma.raidDroppedItem.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return null; // Record not found
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.raidDroppedItem.delete({
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

  async getStats(): Promise<{
    total: number;
    totalByCategory: Record<string, number>;
    totalByGrade: Record<string, number>;
    averageMinDkpBid: number;
  }> {
    const [total, categoryStats, gradeStats, avgBid] = await Promise.all([
      this.prisma.raidDroppedItem.count(),
      this.prisma.raidDroppedItem.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      this.prisma.raidDroppedItem.groupBy({
        by: ['grade'],
        _count: { grade: true },
      }),
      this.prisma.raidDroppedItem.aggregate({
        _avg: { minDkpBid: true },
      }),
    ]);

    const totalByCategory = categoryStats.reduce(
      (acc, stat) => {
        acc[stat.category] = stat._count.category;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalByGrade = gradeStats.reduce(
      (acc, stat) => {
        acc[stat.grade] = stat._count.grade;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      totalByCategory,
      totalByGrade,
      averageMinDkpBid: Math.round(avgBid._avg.minDkpBid || 0),
    };
  }
}
