import type { PrismaClient, Item, ItemCategory, ItemGrade } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ConflictError } from '@/libs/errors.ts';

export interface CreateItemData {
  name: string;
  category: ItemCategory;
  grade: ItemGrade;
  valorGsInt: number;
  valorDkp: number;
}

export interface UpdateItemData {
  name?: string;
  category?: ItemCategory;
  grade?: ItemGrade;
  valorGsInt?: number;
  valorDkp?: number;
}

export interface GetItemsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: ItemCategory;
  grade?: ItemGrade;
  sortBy?: 'name' | 'category' | 'grade' | 'valorGsInt' | 'valorDkp' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ItemsListResult {
  data: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ItemRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(options: GetItemsOptions = {}): Promise<ItemsListResult> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      grade,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ItemWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.category = category;
    }

    if (grade) {
      where.grade = grade;
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where: { name },
    });
  }

  async create(data: CreateItemData): Promise<Item> {
    try {
      return await this.prisma.item.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.['target'] as string[];
          if (target?.includes('name')) {
            throw new ConflictError('Item name already exists');
          }
          throw new ConflictError('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateItemData): Promise<Item | null> {
    try {
      return await this.prisma.item.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.['target'] as string[];
          if (target?.includes('name')) {
            throw new ConflictError('Item name already exists');
          }
          throw new ConflictError('Unique constraint violation');
        }
        if (error.code === 'P2025') {
          return null; // Record not found
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.item.delete({
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

  async count(): Promise<number> {
    return this.prisma.item.count();
  }
}
