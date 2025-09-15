import type { PrismaClient } from '@prisma/client';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  GetUsersQuery,
  UserResponse,
  UsersListResponse,
} from '@/routes/users/users.schema.ts';
import { UserRepository } from './user.repository.ts';
import { CompanyPartyRepository } from '@/modules/company-parties/company-party.repository.ts';
import { NotFoundError } from '@/libs/errors.ts';
import { PasswordUtils } from '@/libs/password.ts';

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
        classe: user.classe
          ? {
            ...user.classe,
            createdAt: user.classe.createdAt.toISOString(),
          }
          : null,
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

    const userWithCPs =
      await this.companyPartyRepository.getUserWithCompanyParties(id);
    const companyParties =
      userWithCPs?.companyParties.map(userCP => ({
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
      classe: user.classe
        ? {
          ...user.classe,
          createdAt: user.classe.createdAt.toISOString(),
        }
        : null,
      companyParties,
    };
  }

  async createUser(data: CreateUserInput): Promise<UserResponse> {
    // Validate password
    const passwordValidation = PasswordUtils.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash the password
    const hashedPassword = await PasswordUtils.hash(data.password);

    // Clean the data to remove any invalid fields and convert empty strings to null
    const cleanData = {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      nickname: data.nickname,
      avatar: data.avatar,
      isActive: data.isActive,
      lvl: data.lvl,
      role: data.role,
      classeId: data.classeId === '' ? null : data.classeId,
    };

    if (!cleanData.avatar) {
      const seed = encodeURIComponent(
        cleanData.name.toLowerCase().replace(/\s+/g, '')
      );
      cleanData.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    }

    const user = await this.userRepository.create(cleanData);

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<UserResponse> {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new NotFoundError('User');
    }

    // If password is being updated, hash it
    let updateData = { ...data };
    if (data.password) {
      const passwordValidation = PasswordUtils.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }
      updateData.password = await PasswordUtils.hash(data.password);
    }

    const user = await this.userRepository.update(id, updateData);

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      classe: user.classe
        ? {
          ...user.classe,
          createdAt: user.classe.createdAt.toISOString(),
        }
        : null,
    };
  }

  async deleteUser(id: string): Promise<void> {
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
      nickname: user.nickname,
      avatar: user.avatar,
      isActive: user.isActive,
      lvl: user.lvl,
      role: user.role as 'ADMIN' | 'PLAYER',
      classeId: user.classeId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      classe: user.classe
        ? {
          ...user.classe,
          createdAt: user.classe.createdAt.toISOString(),
        }
        : null,
    };
  }

  async updateProfile(
    id: string,
    data: UpdateProfileInput
  ): Promise<UserResponse> {
    const user = await this.userRepository.update(id, data);

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      classe: user.classe
        ? {
          ...user.classe,
          createdAt: user.classe.createdAt.toISOString(),
        }
        : null,
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
