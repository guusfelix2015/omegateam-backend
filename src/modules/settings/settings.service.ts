import { NotFoundError, ValidationError } from '@/libs/errors.ts';
import type {
  SettingsRepository,
  SettingsEntity,
  CreateSettingsData,
  UpdateSettingsData,
} from './settings.repository.ts';

export interface SettingsResponse {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  private toSettingsResponse(settings: SettingsEntity): SettingsResponse {
    return {
      id: settings.id,
      key: settings.key,
      value: settings.value,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async getSettingByKey(key: string): Promise<SettingsResponse> {
    const setting = await this.settingsRepository.findByKey(key);
    if (!setting) {
      throw new NotFoundError(`Setting with key "${key}" not found`);
    }
    return this.toSettingsResponse(setting);
  }

  async getAllSettings(): Promise<SettingsResponse[]> {
    const settings = await this.settingsRepository.findAll();
    return settings.map(setting => this.toSettingsResponse(setting));
  }

  async createSetting(data: CreateSettingsData): Promise<SettingsResponse> {
    // Validate key format
    if (!data.key || data.key.trim().length === 0) {
      throw new ValidationError('Setting key is required');
    }

    if (!data.value || data.value.trim().length === 0) {
      throw new ValidationError('Setting value is required');
    }

    // Check if key already exists
    const existing = await this.settingsRepository.findByKey(data.key);
    if (existing) {
      throw new ValidationError(`Setting with key "${data.key}" already exists`);
    }

    const setting = await this.settingsRepository.create({
      key: data.key.trim(),
      value: data.value,
    });

    return this.toSettingsResponse(setting);
  }

  async updateSetting(
    key: string,
    data: UpdateSettingsData
  ): Promise<SettingsResponse> {
    // Validate value
    if (!data.value || data.value.trim().length === 0) {
      throw new ValidationError('Setting value is required');
    }

    // Check if setting exists
    const existing = await this.settingsRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundError(`Setting with key "${key}" not found`);
    }

    const setting = await this.settingsRepository.update(key, {
      value: data.value,
    });

    return this.toSettingsResponse(setting);
  }

  async upsertSetting(key: string, value: string): Promise<SettingsResponse> {
    // Validate inputs
    if (!key || key.trim().length === 0) {
      throw new ValidationError('Setting key is required');
    }

    if (!value || value.trim().length === 0) {
      throw new ValidationError('Setting value is required');
    }

    const setting = await this.settingsRepository.upsert(
      key.trim(),
      value
    );

    return this.toSettingsResponse(setting);
  }

  async deleteSetting(key: string): Promise<void> {
    // Check if setting exists
    const existing = await this.settingsRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundError(`Setting with key "${key}" not found`);
    }

    await this.settingsRepository.delete(key);
  }
}

