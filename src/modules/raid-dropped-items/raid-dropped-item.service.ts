import {
  RaidDroppedItemRepository,
  type CreateRaidDroppedItemData,
  type UpdateRaidDroppedItemData,
  type GetRaidDroppedItemsOptions,
  type RaidDroppedItemWithRelations,
} from './raid-dropped-item.repository.ts';
import { RaidInstanceRepository } from '@/modules/raid-instances/raid-instance.repository.ts';
import { NotFoundError, ValidationError } from '@/libs/errors.ts';
import type { RaidDroppedItem, ItemCategory, ItemGrade } from '@prisma/client';

export interface CreateRaidDroppedItemInput {
  name: string;
  category: ItemCategory;
  grade: ItemGrade;
  minDkpBid: number;
  raidInstanceId: string;
  notes?: string;
}

export interface UpdateRaidDroppedItemInput {
  name?: string;
  category?: ItemCategory;
  grade?: ItemGrade;
  minDkpBid?: number;
  notes?: string;
}

export interface GetRaidDroppedItemsQuery {
  page?: number;
  limit?: number;
  raidInstanceId?: string;
  category?: ItemCategory;
  grade?: ItemGrade;
  sortBy?: 'droppedAt' | 'name' | 'minDkpBid';
  sortOrder?: 'asc' | 'desc';
}

export interface RaidDroppedItemResponse {
  id: string;
  name: string;
  category: ItemCategory;
  grade: ItemGrade;
  minDkpBid: number;
  raidInstanceId: string;
  droppedAt: string;
  createdBy: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  raidInstance?: {
    id: string;
    completedAt: string;
    raid: {
      id: string;
      name: string;
      bossLevel: number;
    };
  };
}

export interface RaidDroppedItemsListResponse {
  data: RaidDroppedItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class RaidDroppedItemService {
  constructor(
    private raidDroppedItemRepository: RaidDroppedItemRepository,
    private raidInstanceRepository: RaidInstanceRepository
  ) {}

  async createRaidDroppedItem(
    data: CreateRaidDroppedItemInput,
    adminId: string
  ): Promise<RaidDroppedItemResponse> {
    // Validate that raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(data.raidInstanceId);
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    // Validate minimum DKP bid
    if (data.minDkpBid < 0) {
      throw new ValidationError('Minimum DKP bid must be non-negative');
    }

    // Validate item name
    if (!data.name.trim()) {
      throw new ValidationError('Item name is required');
    }

    const createData: CreateRaidDroppedItemData = {
      ...data,
      name: data.name.trim(),
      createdBy: adminId,
    };

    const droppedItem = await this.raidDroppedItemRepository.create(createData);
    return this.toRaidDroppedItemResponse(droppedItem);
  }

  async getRaidDroppedItems(
    query: Partial<GetRaidDroppedItemsQuery> = {}
  ): Promise<RaidDroppedItemsListResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'droppedAt',
      sortOrder = 'desc',
      raidInstanceId,
      category,
      grade,
    } = query;

    const options: GetRaidDroppedItemsOptions = {
      page,
      limit,
      raidInstanceId,
      category,
      grade,
      sortBy,
      sortOrder,
    };

    const { data, total } = await this.raidDroppedItemRepository.findAll(options);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map(item => this.toRaidDroppedItemResponseWithRelations(item)),
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

  async getRaidDroppedItemById(id: string): Promise<RaidDroppedItemResponse> {
    const droppedItem = await this.raidDroppedItemRepository.findById(id);
    if (!droppedItem) {
      throw new NotFoundError('Raid dropped item');
    }

    return this.toRaidDroppedItemResponseWithRelations(droppedItem);
  }

  async getRaidDroppedItemsByRaidInstanceId(raidInstanceId: string): Promise<RaidDroppedItemResponse[]> {
    // Validate that raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(raidInstanceId);
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    const droppedItems = await this.raidDroppedItemRepository.findByRaidInstanceId(raidInstanceId);
    return droppedItems.map(item => this.toRaidDroppedItemResponse(item));
  }

  async updateRaidDroppedItem(
    id: string,
    data: UpdateRaidDroppedItemInput
  ): Promise<RaidDroppedItemResponse> {
    // Validate minimum DKP bid if provided
    if (data.minDkpBid !== undefined && data.minDkpBid < 0) {
      throw new ValidationError('Minimum DKP bid must be non-negative');
    }

    // Validate item name if provided
    if (data.name !== undefined && !data.name.trim()) {
      throw new ValidationError('Item name is required');
    }

    const updateData: UpdateRaidDroppedItemData = {
      ...data,
      name: data.name ? data.name.trim() : undefined,
    };

    const updatedItem = await this.raidDroppedItemRepository.update(id, updateData);
    if (!updatedItem) {
      throw new NotFoundError('Raid dropped item');
    }

    return this.toRaidDroppedItemResponse(updatedItem);
  }

  async deleteRaidDroppedItem(id: string): Promise<void> {
    const success = await this.raidDroppedItemRepository.delete(id);
    if (!success) {
      throw new NotFoundError('Raid dropped item');
    }
  }

  async getRaidDroppedItemStats(): Promise<{
    total: number;
    totalByCategory: Record<string, number>;
    totalByGrade: Record<string, number>;
    averageMinDkpBid: number;
  }> {
    return this.raidDroppedItemRepository.getStats();
  }

  private toRaidDroppedItemResponse(item: RaidDroppedItem): RaidDroppedItemResponse {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      grade: item.grade,
      minDkpBid: item.minDkpBid,
      raidInstanceId: item.raidInstanceId,
      droppedAt: item.droppedAt.toISOString(),
      createdBy: item.createdBy,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toRaidDroppedItemResponseWithRelations(
    item: RaidDroppedItemWithRelations
  ): RaidDroppedItemResponse {
    return {
      ...this.toRaidDroppedItemResponse(item),
      raidInstance: {
        id: item.raidInstance.id,
        completedAt: item.raidInstance.completedAt.toISOString(),
        raid: {
          id: item.raidInstance.raid.id,
          name: item.raidInstance.raid.name,
          bossLevel: item.raidInstance.raid.bossLevel,
        },
      },
    };
  }
}
