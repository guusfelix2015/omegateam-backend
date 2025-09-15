import type { PrismaClient, CompanyParty, User } from '@prisma/client';

export interface CompanyPartyWithUsers extends CompanyParty {
  users: Array<{
    id: string;
    userId: string;
    joinedAt: Date;
    user: {
      id: string;
      email: string;
      name: string;
      nickname: string;
      avatar: string | null;
      lvl: number;
      role: string;
    };
  }>;
}

export interface UserWithCompanyParties extends Omit<User, 'password'> {
  companyParties: Array<{
    id: string;
    companyPartyId: string;
    joinedAt: Date;
    companyParty: {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}

export interface CreateCompanyPartyData {
  name: string;
  description?: string;
  maxMembers?: number;
}

export interface UpdateCompanyPartyData {
  name?: string;
  description?: string;
  maxMembers?: number;
}

export interface GetCompanyPartiesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export class CompanyPartyRepository {
  constructor(private prisma: PrismaClient) { }

  async create(data: CreateCompanyPartyData): Promise<CompanyParty> {
    return this.prisma.companyParty.create({
      data,
    });
  }

  async findMany(options: GetCompanyPartiesOptions = {}): Promise<{
    data: CompanyPartyWithUsers[];
    total: number;
  }> {
    const { page = 1, limit = 10, search } = options;
    const skip = (page - 1) * limit;

    const where = search
      ? {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.companyParty.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  nickname: true,
                  avatar: true,
                  lvl: true,
                  role: true,
                },
              },
            },
            orderBy: {
              joinedAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.companyParty.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<CompanyPartyWithUsers | null> {
    return this.prisma.companyParty.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                avatar: true,
                lvl: true,
                role: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<CompanyParty | null> {
    return this.prisma.companyParty.findUnique({
      where: { name },
    });
  }

  async update(id: string, data: UpdateCompanyPartyData): Promise<CompanyParty | null> {
    try {
      return await this.prisma.companyParty.update({
        where: { id },
        data,
      });
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.companyParty.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async addPlayer(companyPartyId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.userCompanyParty.create({
        data: {
          companyPartyId,
          userId,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removePlayer(companyPartyId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.userCompanyParty.delete({
        where: {
          userId_companyPartyId: {
            userId,
            companyPartyId,
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async isPlayerInCompanyParty(companyPartyId: string, userId: string): Promise<boolean> {
    const relation = await this.prisma.userCompanyParty.findUnique({
      where: {
        userId_companyPartyId: {
          userId,
          companyPartyId,
        },
      },
    });
    return !!relation;
  }

  async getUserWithCompanyParties(userId: string): Promise<UserWithCompanyParties | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
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
        companyParties: {
          include: {
            companyParty: true,
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
      },
    });
  }
}
