import {
  CompanyPartyRepository,
  type CreateCompanyPartyData,
  type UpdateCompanyPartyData,
  type GetCompanyPartiesOptions,
} from './company-party.repository.ts';

export interface CompanyPartyResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    email: string;
    name: string;
    nickname: string;
    avatar: string | null;
    lvl: number;
    role: string;
  }>;
}

export interface CompanyPartyListResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
}

export interface PaginatedCompanyPartiesResponse {
  data: CompanyPartyListResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserCompanyPartyResponse {
  id: string;
  companyPartyId: string;
  joinedAt: string;
  companyParty: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class CompanyPartyService {
  constructor(private companyPartyRepository: CompanyPartyRepository) {}

  async createCompanyParty(
    data: CreateCompanyPartyData
  ): Promise<CompanyPartyResponse> {
    const existingCP = await this.companyPartyRepository.findByName(data.name);
    if (existingCP) {
      throw new Error('Company Party with this name already exists');
    }

    const companyParty = await this.companyPartyRepository.create(data);

    return {
      id: companyParty.id,
      name: companyParty.name,
      createdAt: companyParty.createdAt.toISOString(),
      updatedAt: companyParty.updatedAt.toISOString(),
      users: [],
    };
  }

  async getCompanyParties(
    options: GetCompanyPartiesOptions = {}
  ): Promise<PaginatedCompanyPartiesResponse> {
    const { data, total } = await this.companyPartyRepository.findMany(options);
    const { page = 1, limit = 10 } = options;

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const companyParties: CompanyPartyListResponse[] = data.map(cp => ({
      id: cp.id,
      name: cp.name,
      createdAt: cp.createdAt.toISOString(),
      updatedAt: cp.updatedAt.toISOString(),
      playerCount: cp.users.length,
    }));

    return {
      data: companyParties,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async getCompanyPartyById(id: string): Promise<CompanyPartyResponse | null> {
    const companyParty = await this.companyPartyRepository.findById(id);
    if (!companyParty) {
      return null;
    }

    return {
      id: companyParty.id,
      name: companyParty.name,
      createdAt: companyParty.createdAt.toISOString(),
      updatedAt: companyParty.updatedAt.toISOString(),
      users: companyParty.users.map(userCP => ({
        id: userCP.user.id,
        email: userCP.user.email,
        name: userCP.user.name,
        nickname: userCP.user.nickname,
        avatar: userCP.user.avatar,
        lvl: userCP.user.lvl,
        role: userCP.user.role,
      })),
    };
  }

  async updateCompanyParty(
    id: string,
    data: UpdateCompanyPartyData
  ): Promise<CompanyPartyResponse | null> {
    if (data.name) {
      const existingCP = await this.companyPartyRepository.findByName(
        data.name
      );
      if (existingCP && existingCP.id !== id) {
        throw new Error('Company Party with this name already exists');
      }
    }

    const updatedCP = await this.companyPartyRepository.update(id, data);
    if (!updatedCP) {
      return null;
    }

    return this.getCompanyPartyById(id);
  }

  async deleteCompanyParty(id: string): Promise<boolean> {
    return this.companyPartyRepository.delete(id);
  }

  async addPlayerToCompanyParty(
    companyPartyId: string,
    userId: string
  ): Promise<boolean> {
    const companyParty =
      await this.companyPartyRepository.findById(companyPartyId);
    if (!companyParty) {
      throw new Error('Company Party not found');
    }

    const isAlreadyMember =
      await this.companyPartyRepository.isPlayerInCompanyParty(
        companyPartyId,
        userId
      );
    if (isAlreadyMember) {
      throw new Error('Player is already a member of this Company Party');
    }

    return this.companyPartyRepository.addPlayer(companyPartyId, userId);
  }

  async removePlayerFromCompanyParty(
    companyPartyId: string,
    userId: string
  ): Promise<boolean> {
    const companyParty =
      await this.companyPartyRepository.findById(companyPartyId);
    if (!companyParty) {
      throw new Error('Company Party not found');
    }

    const isMember = await this.companyPartyRepository.isPlayerInCompanyParty(
      companyPartyId,
      userId
    );
    if (!isMember) {
      throw new Error('Player is not a member of this Company Party');
    }

    return this.companyPartyRepository.removePlayer(companyPartyId, userId);
  }

  async getUserCompanyParties(
    userId: string
  ): Promise<UserCompanyPartyResponse[]> {
    const userWithCPs =
      await this.companyPartyRepository.getUserWithCompanyParties(userId);
    if (!userWithCPs) {
      return [];
    }

    return userWithCPs.companyParties.map(userCP => ({
      id: userCP.id,
      companyPartyId: userCP.companyPartyId,
      joinedAt: userCP.joinedAt.toISOString(),
      companyParty: {
        id: userCP.companyParty.id,
        name: userCP.companyParty.name,
        createdAt: userCP.companyParty.createdAt.toISOString(),
        updatedAt: userCP.companyParty.updatedAt.toISOString(),
      },
    }));
  }
}
