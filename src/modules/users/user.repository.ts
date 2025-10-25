import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import type {
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
} from '@/routes/users/users.schema.ts';
import { NotFoundError, ConflictError } from '@/libs/errors.ts';

type UserWithClasse = Omit<User, 'password'> & {
  classe: {
    id: string;
    name: string;
    createdAt: Date;
  } | null;
};

export class UserRepository {
  constructor(private prisma: PrismaClient) { }

  async findMany(query: GetUsersQuery) {
    const { page, limit, search, isActive, role, sortBy, sortOrder } = query;
    // Ensure page and limit are numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (role !== undefined) {
      where.role = role;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: skip || 0,
        take: limitNum || 10,
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          avatar: true,
          isActive: true,
          lvl: true,
          role: true,
          classeId: true,
          ownedItemIds: true,
          gearScore: true,
          dkpPoints: true,
          bagUrl: true,
          createdAt: true,
          updatedAt: true,
          classe: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1,
    };
  }

  async findById(id: string): Promise<UserWithClasse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        avatar: true,
        isActive: true,
        lvl: true,
        role: true,
        classeId: true,
        ownedItemIds: true,
        gearScore: true,
        dkpPoints: true,
        bagUrl: true,
        createdAt: true,
        updatedAt: true,
        classe: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<UserWithClasse | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        avatar: true,
        isActive: true,
        lvl: true,
        role: true,
        classeId: true,
        ownedItemIds: true,
        gearScore: true,
        dkpPoints: true,
        bagUrl: true,
        createdAt: true,
        updatedAt: true,
        classe: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findByNickname(
    nickname: string
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        avatar: true,
        isActive: true,
        lvl: true,
        role: true,
        classeId: true,
        ownedItemIds: true,
        gearScore: true,
        dkpPoints: true,
        bagUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async create(data: CreateUserInput): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.prisma.user.create({
        data,
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          avatar: true,
          isActive: true,
          lvl: true,
          role: true,
          classeId: true,
          classe: true,
          ownedItemIds: true,
          gearScore: true,
          dkpPoints: true,
          bagUrl: true,
          phone: true,
          playerType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.['target'] as string[];
          if (target?.includes('email')) {
            throw new ConflictError('Email already exists');
          }
          if (target?.includes('nickname')) {
            throw new ConflictError('Nickname already exists');
          }
          throw new ConflictError('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<UserWithClasse> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          avatar: true,
          isActive: true,
          lvl: true,
          role: true,
          classeId: true,
          ownedItemIds: true,
          gearScore: true,
          dkpPoints: true,
          bagUrl: true,
          createdAt: true,
          updatedAt: true,
          classe: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('User');
        }
        if (error.code === 'P2002') {
          const target = error.meta?.['target'] as string[];
          if (target?.includes('email')) {
            throw new ConflictError('Email already exists');
          }
          if (target?.includes('nickname')) {
            throw new ConflictError('Nickname already exists');
          }
          throw new ConflictError('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('User');
        }
      }
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    players: number;
  }> {
    const [total, active, admins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      admins,
      players: total - admins,
    };
  }

  async updateUserGear(
    userId: string,
    items: Array<{
      itemId: string;
      enhancementLevel: number;
      isRare?: boolean;
    }>,
    gearScore: number
  ): Promise<void> {
    await this.prisma.$transaction(async tx => {
      // Delete existing user items
      await tx.userItem.deleteMany({
        where: { userId },
      });

      // Create new user items with enhancement levels and rare status
      if (items.length > 0) {
        await tx.userItem.createMany({
          data: items.map(item => ({
            userId,
            itemId: item.itemId,
            enhancementLevel: item.enhancementLevel,
            isRare: item.isRare ?? false,
          })),
        });
      }

      // Update user gear score
      await tx.user.update({
        where: { id: userId },
        data: { gearScore },
      });
    });
  }

  async updateUserDkpBalance(id: string, amount: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          dkpPoints: {
            increment: amount,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('User');
        }
      }
      throw error;
    }
  }

  async getUserGear(userId: string): Promise<{
    gearScore: number;
    userItems: Array<{
      id: string;
      itemId: string;
      enhancementLevel: number;
      isRare: boolean;
      item: {
        id: string;
        name: string;
        category: string;
        grade: string;
        valorGsInt: number;
        valorDkp: number;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        gearScore: true,
        userItems: {
          include: {
            item: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!user) return null;

    return {
      gearScore: user.gearScore,
      userItems: user.userItems,
    };
  }

  async updateItemEnhancement(
    userItemId: string,
    enhancementLevel: number,
    isRare?: boolean
  ): Promise<void> {
    const updateData: { enhancementLevel: number; isRare?: boolean } = {
      enhancementLevel,
    };

    if (isRare !== undefined) {
      updateData.isRare = isRare;
    }

    await this.prisma.userItem.update({
      where: { id: userItemId },
      data: updateData,
    });
  }

  async updateGearScore(userId: string, gearScore: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { gearScore },
    });
  }

  async findByIdWithCompanyParties(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        companyParties: {
          include: {
            companyParty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findMembersByCPIds(cpIds: string[]) {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        companyParties: {
          some: {
            companyPartyId: {
              in: cpIds,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        lvl: true,
        role: true,
        gearScore: true,
        isActive: true,
        companyParties: {
          include: {
            companyParty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
