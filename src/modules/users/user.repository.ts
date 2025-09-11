import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import type {
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
} from '@/routes/users/users.schema.js';
import { NotFoundError, ConflictError } from '@/libs/errors.js';

// Type for user with classe relation
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
    const skip = (page - 1) * limit;

    // Build where clause
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

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: skip || 0,
        take: limit || 10,
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
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
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

  async findByNickname(nickname: string): Promise<Omit<User, 'password'> | null> {
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

  async update(
    id: string,
    data: UpdateUserInput
  ): Promise<UserWithClasse> {
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
}
