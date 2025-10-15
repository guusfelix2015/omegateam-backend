import type { PrismaClient, ItemCategory } from '@prisma/client';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  GetUsersQuery,
  UserResponse,
  UsersListResponse,
  UpdateUserGearInput,
  UserGearResponse,
  UpdateItemEnhancementInput,
} from '@/routes/users/users.schema.ts';
import { UserRepository } from './user.repository.ts';
import { CompanyPartyRepository } from '@/modules/company-parties/company-party.repository.ts';
import { ItemRepository } from '@/modules/items/item.repository.ts';
import { NotFoundError, ValidationError } from '@/libs/errors.ts';
import { PasswordUtils } from '@/libs/password.ts';
import { EnhancementCalculationService } from '@/modules/items/enhancement-calculation.service.ts';

// Category limits for gear items
const CATEGORY_LIMITS: Record<string, number> = {
  RING: 2,
  EARRING: 2,
  NECKLACE: 1,
  HELMET: 1,
  ARMOR: 1,
  PANTS: 1,
  BOOTS: 1,
  GLOVES: 1,
  SHIELD: 1,
  WEAPON: 1,
  COMUM: 999, // Effectively unlimited
};

export class UserService {
  private userRepository: UserRepository;
  private companyPartyRepository: CompanyPartyRepository;
  private itemRepository: ItemRepository;
  private enhancementService: EnhancementCalculationService;

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
    this.companyPartyRepository = new CompanyPartyRepository(prisma);
    this.itemRepository = new ItemRepository(prisma);
    this.enhancementService = new EnhancementCalculationService();
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
      throw new Error(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`
      );
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
        throw new Error(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`
        );
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
      ownedItemIds: user.ownedItemIds,
      gearScore: user.gearScore,
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
    let updateData = { ...data };
    if (data.password) {
      const passwordValidation = PasswordUtils.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`
        );
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

  async getUserGear(id: string): Promise<UserGearResponse> {
    const gearData = await this.userRepository.getUserGear(id);
    if (!gearData) {
      throw new NotFoundError('User');
    }

    return {
      gearScore: gearData.gearScore,
      userItems: gearData.userItems.map(userItem => ({
        id: userItem.id,
        itemId: userItem.itemId,
        enhancementLevel: userItem.enhancementLevel,
        item: {
          id: userItem.item.id,
          name: userItem.item.name,
          category: userItem.item.category,
          grade: userItem.item.grade,
          valorGsInt: userItem.item.valorGsInt,
          valorDkp: userItem.item.valorDkp,
          createdAt: userItem.item.createdAt.toISOString(),
          updatedAt: userItem.item.updatedAt.toISOString(),
        },
      })),
    };
  }

  /**
   * Validate that the gear configuration respects category limits
   */
  private async validateGearLimits(
    items: Array<{ itemId: string; enhancementLevel: number }>
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    // Get unique item IDs and fetch items
    const uniqueIds = Array.from(new Set(items.map(i => i.itemId)));
    const itemsData = await this.itemRepository.findByIds(uniqueIds);

    // Create a map of id -> item for quick lookup
    const itemMap = new Map(itemsData.map(item => [item.id, item]));

    // Count items by category
    const categoryCounts = new Map<string, number>();
    items.forEach(({ itemId }) => {
      const item = itemMap.get(itemId);
      if (item) {
        const count = categoryCounts.get(item.category) || 0;
        categoryCounts.set(item.category, count + 1);
      }
    });

    // Check limits
    for (const [category, count] of categoryCounts.entries()) {
      const limit = CATEGORY_LIMITS[category] || 1;
      if (count > limit) {
        const categoryName = this.getCategoryDisplayName(category);
        throw new ValidationError(
          `Não é possível equipar mais de ${limit} ${categoryName}(s)`
        );
      }
    }
  }

  /**
   * Get display name for category (Portuguese)
   */
  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      RING: 'anel',
      EARRING: 'brinco',
      NECKLACE: 'colar',
      HELMET: 'capacete',
      ARMOR: 'armadura',
      PANTS: 'calça',
      BOOTS: 'bota',
      GLOVES: 'luva',
      SHIELD: 'escudo',
      WEAPON: 'arma',
      COMUM: 'item comum',
    };
    return names[category] || category.toLowerCase();
  }

  async updateUserGear(
    id: string,
    data: UpdateUserGearInput
  ): Promise<UserGearResponse> {
    // Check if user exists
    const userExists = await this.userRepository.exists(id);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    // Validate that all unique item IDs exist
    const uniqueItemIds = Array.from(new Set(data.items.map(i => i.itemId)));
    const itemsExist = await this.itemRepository.validateItemIds(uniqueItemIds);
    if (!itemsExist) {
      throw new ValidationError('One or more item IDs are invalid');
    }

    // Validate category limits
    await this.validateGearLimits(data.items);

    // Fetch items
    const items = await this.itemRepository.findByIds(uniqueItemIds);
    const itemMap = new Map(items.map(item => [item.id, item]));

    // Calculate total gear score with enhancements
    const gearScore = data.items.reduce((total, userItem) => {
      const item = itemMap.get(userItem.itemId);
      if (!item) return total;

      const itemGS = this.enhancementService.calculateTotalItemGS(
        item.valorGsInt,
        userItem.enhancementLevel
      );
      return total + itemGS;
    }, 0);

    // Update user items and gear score
    await this.userRepository.updateUserGear(id, data.items, gearScore);

    // Return updated gear info
    return this.getUserGear(id);
  }

  async updateItemEnhancement(
    userId: string,
    data: UpdateItemEnhancementInput
  ): Promise<UserGearResponse> {
    // Check if user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    // Update the enhancement level
    await this.userRepository.updateItemEnhancement(
      data.userItemId,
      data.enhancementLevel
    );

    // Recalculate and update gear score
    const gearData = await this.userRepository.getUserGear(userId);
    if (!gearData) {
      throw new NotFoundError('User gear');
    }

    // Calculate new total gear score
    const gearScore = gearData.userItems.reduce((total, userItem) => {
      const itemGS = this.enhancementService.calculateTotalItemGS(
        userItem.item.valorGsInt,
        userItem.enhancementLevel
      );
      return total + itemGS;
    }, 0);

    // Update gear score
    await this.userRepository.updateGearScore(userId, gearScore);

    // Return updated gear info
    return this.getUserGear(userId);
  }

  async getCPMembers(userId: string) {
    // Get user's company parties
    const userWithCPs =
      await this.userRepository.findByIdWithCompanyParties(userId);
    if (!userWithCPs) {
      throw new NotFoundError('User not found');
    }

    // Get all members from user's company parties
    const cpIds = userWithCPs.companyParties.map(cp => cp.companyPartyId);

    if (cpIds.length === 0) {
      return [];
    }

    const members = await this.userRepository.findMembersByCPIds(cpIds);

    // Format response with gear score and basic info
    return members.map(member => ({
      id: member.id,
      name: member.name,
      nickname: member.nickname,
      avatar: member.avatar,
      lvl: member.lvl,
      role: member.role,
      gearScore: member.gearScore,
      isActive: member.isActive,
      companyParties: member.companyParties.map(cp => ({
        id: cp.companyPartyId,
        name: cp.companyParty.name,
        joinedAt: cp.joinedAt.toISOString(),
      })),
    }));
  }
}
