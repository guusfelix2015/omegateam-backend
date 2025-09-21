import type {
  CreateRaidInput,
  UpdateRaidInput,
  GetRaidsQuery,
  RaidResponse,
  RaidsListResponse,
} from '@/routes/raids/raids.schema.ts';
import {
  RaidRepository,
  type CreateRaidData,
  type UpdateRaidData,
  type GetRaidsOptions,
  type RaidEntity,
} from './raid.repository.ts';
import { NotFoundError, ValidationError } from '@/libs/errors.ts';

export class RaidService {
  constructor(private raidRepository: RaidRepository) { }

  private toRaidResponse(raid: RaidEntity): RaidResponse {
    return {
      id: raid.id,
      name: raid.name,
      bossLevel: raid.bossLevel,
      baseScore: raid.baseScore,
      isActive: raid.isActive,
      createdAt: raid.createdAt.toISOString(),
      updatedAt: raid.updatedAt.toISOString(),
    };
  }



  async createRaid(data: CreateRaidInput): Promise<RaidResponse> {
    // Validate that raid name doesn't already exist
    const existingRaid = await this.raidRepository.findByName(data.name);
    if (existingRaid) {
      throw new ValidationError('Raid with this name already exists');
    }

    // Validate boss level and base score ranges
    if (data.bossLevel < 1 || data.bossLevel > 100) {
      throw new ValidationError('Boss level must be between 1 and 100');
    }

    if (data.baseScore < 1 || data.baseScore > 1000) {
      throw new ValidationError('Base score must be between 1 and 1000');
    }

    const cleanData: CreateRaidData = {
      name: data.name.trim(),
      bossLevel: data.bossLevel,
      baseScore: data.baseScore,
    };

    const raid = await this.raidRepository.create(cleanData);
    return this.toRaidResponse(raid);
  }

  async getRaids(query: Partial<GetRaidsQuery> = {}): Promise<RaidsListResponse> {
    const options: GetRaidsOptions = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search?.trim(),
      isActive: query.isActive,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    };

    const { data, total } = await this.raidRepository.findAll(options);
    const { page = 1, limit = 10 } = query;

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map(raid => this.toRaidResponse(raid)),
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

  async getRaidById(id: string): Promise<RaidResponse> {
    const raid = await this.raidRepository.findById(id);
    if (!raid) {
      throw new NotFoundError('Raid');
    }

    return this.toRaidResponse(raid);
  }

  async updateRaid(id: string, data: UpdateRaidInput): Promise<RaidResponse> {
    // Check if raid exists
    const existingRaid = await this.raidRepository.findById(id);
    if (!existingRaid) {
      throw new NotFoundError('Raid');
    }

    // Validate name uniqueness if name is being updated
    if (data.name && data.name !== existingRaid.name) {
      const raidWithSameName = await this.raidRepository.findByName(data.name);
      if (raidWithSameName) {
        throw new ValidationError('Raid with this name already exists');
      }
    }

    // Validate ranges if provided
    if (data.bossLevel !== undefined && (data.bossLevel < 1 || data.bossLevel > 100)) {
      throw new ValidationError('Boss level must be between 1 and 100');
    }

    if (data.baseScore !== undefined && (data.baseScore < 1 || data.baseScore > 1000)) {
      throw new ValidationError('Base score must be between 1 and 1000');
    }

    const cleanData: UpdateRaidData = {};
    if (data.name !== undefined) cleanData.name = data.name.trim();
    if (data.bossLevel !== undefined) cleanData.bossLevel = data.bossLevel;
    if (data.baseScore !== undefined) cleanData.baseScore = data.baseScore;
    if (data.isActive !== undefined) cleanData.isActive = data.isActive;

    const updatedRaid = await this.raidRepository.update(id, cleanData);
    return this.toRaidResponse(updatedRaid);
  }

  async deleteRaid(id: string): Promise<void> {
    const success = await this.raidRepository.delete(id);
    if (!success) {
      throw new NotFoundError('Raid');
    }
  }

  async deactivateRaid(id: string): Promise<RaidResponse> {
    try {
      const raid = await this.raidRepository.deactivate(id);
      return this.toRaidResponse(raid);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Raid');
      }
      throw error;
    }
  }

  async activateRaid(id: string): Promise<RaidResponse> {
    try {
      const raid = await this.raidRepository.activate(id);
      return this.toRaidResponse(raid);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Raid');
      }
      throw error;
    }
  }

  async getActiveRaids(): Promise<RaidResponse[]> {
    const raids = await this.raidRepository.getActiveRaids();
    return raids.map(raid => this.toRaidResponse(raid));
  }

  async getRaidStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageBossLevel: number;
    averageBaseScore: number;
  }> {
    return this.raidRepository.getRaidStats();
  }
}
