import type { PrismaClient } from '@prisma/client';
import type {
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
  UserResponse,
  UsersListResponse,
} from '@/routes/users/users.schema.js';
import { UserRepository } from './user.repository.js';
import { CompanyPartyRepository } from '@/modules/company-parties/company-party.repository.js';
import { NotFoundError } from '@/libs/errors.js';

export class UserService {
  private userRepository: UserRepository;
  private companyPartyRepository: CompanyPartyRepository;

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
    this.companyPartyRepository = new CompanyPartyRepository(prisma);
  }

  async getUsers(query: GetUsersQuery): Promise<UsersListResponse> {
    const result = await this.userRepository.findMany(query);

    return {
      data: result.users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    };
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Get user's company parties
    const userWithCPs = await this.companyPartyRepository.getUserWithCompanyParties(id);
    const companyParties = userWithCPs?.companyParties.map(userCP => ({
      id: userCP.id,
      companyPartyId: userCP.companyPartyId,
      joinedAt: userCP.joinedAt.toISOString(),
      companyParty: {
        id: userCP.companyParty.id,
        name: userCP.companyParty.name,
        createdAt: userCP.companyParty.createdAt.toISOString(),
        updatedAt: userCP.companyParty.updatedAt.toISOString(),
      },
    })) ?? [];

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      companyParties,
    };
  }

  async createUser(data: CreateUserInput): Promise<UserResponse> {
    // Generate avatar if not provided
    if (!data.avatar) {
      const seed = encodeURIComponent(
        data.name.toLowerCase().replace(/\s+/g, '')
      );
      data.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    }

    const user = await this.userRepository.create(data);

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<UserResponse> {
    // Check if user exists first
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new NotFoundError('User');
    }

    const user = await this.userRepository.update(id, data);

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async deleteUser(id: string): Promise<void> {
    // Check if user exists first
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new NotFoundError('User');
    }

    await this.userRepository.delete(id);
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname as string,
      avatar: user.avatar,
      isActive: user.isActive,
      lvl: user.lvl as number,
      role: user.role as 'ADMIN' | 'PLAYER',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    players: number;
  }> {
    const stats = await this.userRepository.getStats();
    return stats;
  }
}
