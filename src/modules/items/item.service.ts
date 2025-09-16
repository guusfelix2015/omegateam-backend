import {
  ItemRepository,
  type CreateItemData,
  type UpdateItemData,
  type GetItemsOptions,
} from './item.repository.ts';
import { NotFoundError, ValidationError } from '@/libs/errors.ts';
import type { ItemCategory, ItemGrade } from '@prisma/client';

export interface ItemResponse {
  id: string;
  name: string;
  category: ItemCategory;
  grade: ItemGrade;
  valorGsInt: number;
  valorDkp: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemsListResponse {
  data: ItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ItemStats {
  total: number;
  byCategory: Record<ItemCategory, number>;
  byGrade: Record<ItemGrade, number>;
}

export class ItemService {
  constructor(private itemRepository: ItemRepository) {}

  async getItems(options: GetItemsOptions = {}): Promise<ItemsListResponse> {
    const result = await this.itemRepository.findAll(options);

    return {
      data: result.data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        grade: item.grade,
        valorGsInt: item.valorGsInt,
        valorDkp: item.valorDkp,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      pagination: result.pagination,
    };
  }

  async getItemById(id: string): Promise<ItemResponse> {
    const item = await this.itemRepository.findById(id);

    if (!item) {
      throw new NotFoundError('Item');
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      grade: item.grade,
      valorGsInt: item.valorGsInt,
      valorDkp: item.valorDkp,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async createItem(data: CreateItemData): Promise<ItemResponse> {
    // Validate input data
    this.validateItemData(data);

    // Check if item name already exists
    const existingItem = await this.itemRepository.findByName(data.name);
    if (existingItem) {
      throw new ValidationError('Item with this name already exists');
    }

    const item = await this.itemRepository.create(data);

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      grade: item.grade,
      valorGsInt: item.valorGsInt,
      valorDkp: item.valorDkp,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async updateItem(id: string, data: UpdateItemData): Promise<ItemResponse> {
    // Validate input data
    this.validateItemData(data, true);

    // Check if item exists
    const existingItem = await this.itemRepository.findById(id);
    if (!existingItem) {
      throw new NotFoundError('Item');
    }

    // Check if new name conflicts with existing item (if name is being updated)
    if (data.name && data.name !== existingItem.name) {
      const itemWithSameName = await this.itemRepository.findByName(data.name);
      if (itemWithSameName) {
        throw new ValidationError('Item with this name already exists');
      }
    }

    const updatedItem = await this.itemRepository.update(id, data);

    if (!updatedItem) {
      throw new NotFoundError('Item');
    }

    return {
      id: updatedItem.id,
      name: updatedItem.name,
      category: updatedItem.category,
      grade: updatedItem.grade,
      valorGsInt: updatedItem.valorGsInt,
      valorDkp: updatedItem.valorDkp,
      createdAt: updatedItem.createdAt.toISOString(),
      updatedAt: updatedItem.updatedAt.toISOString(),
    };
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item');
    }

    const deleted = await this.itemRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Item');
    }
  }

  async getItemStats(): Promise<ItemStats> {
    // This would require custom queries or aggregations
    // For now, we'll implement a basic version
    const total = await this.itemRepository.count();

    // In a real implementation, you might want to add specific aggregation queries
    // For now, returning basic structure
    return {
      total,
      byCategory: {
        HELMET: 0,
        ARMOR: 0,
        PANTS: 0,
        BOOTS: 0,
        GLOVES: 0,
        NECKLACE: 0,
        EARRING: 0,
        RING: 0,
        SHIELD: 0,
        WEAPON: 0,
      },
      byGrade: {
        D: 0,
        C: 0,
        B: 0,
        A: 0,
        S: 0,
      },
    };
  }

  private validateItemData(data: Partial<CreateItemData>, isUpdate = false): void {
    if (!isUpdate) {
      // Required fields for creation
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Item name is required');
      }
      if (!data.category) {
        throw new ValidationError('Item category is required');
      }
      if (!data.grade) {
        throw new ValidationError('Item grade is required');
      }
      if (data.valorGsInt === undefined || data.valorGsInt === null) {
        throw new ValidationError('Valor GS INT is required');
      }
      if (data.valorDkp === undefined || data.valorDkp === null) {
        throw new ValidationError('Valor DKP is required');
      }
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new ValidationError('Item name must be a non-empty string');
      }
      if (data.name.length > 100) {
        throw new ValidationError('Item name must be less than 100 characters');
      }
    }

    // Validate valorGsInt if provided
    if (data.valorGsInt !== undefined) {
      if (!Number.isInteger(data.valorGsInt) || data.valorGsInt < 0) {
        throw new ValidationError('Valor GS INT must be a non-negative integer');
      }
    }

    // Validate valorDkp if provided
    if (data.valorDkp !== undefined) {
      if (!Number.isInteger(data.valorDkp) || data.valorDkp < 0) {
        throw new ValidationError('Valor DKP must be a non-negative integer');
      }
    }
  }
}
