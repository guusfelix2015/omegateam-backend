import type { PrismaClient } from '@prisma/client';

export interface SettingsEntity {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSettingsData {
  key: string;
  value: string;
}

export interface UpdateSettingsData {
  value: string;
}

export class SettingsRepository {
  constructor(private prisma: PrismaClient) {}

  async findByKey(key: string): Promise<SettingsEntity | null> {
    return this.prisma.settings.findUnique({
      where: { key },
    });
  }

  async findAll(): Promise<SettingsEntity[]> {
    return this.prisma.settings.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateSettingsData): Promise<SettingsEntity> {
    return this.prisma.settings.create({
      data,
    });
  }

  async update(key: string, data: UpdateSettingsData): Promise<SettingsEntity> {
    return this.prisma.settings.update({
      where: { key },
      data,
    });
  }

  async upsert(key: string, value: string): Promise<SettingsEntity> {
    return this.prisma.settings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async delete(key: string): Promise<SettingsEntity> {
    return this.prisma.settings.delete({
      where: { key },
    });
  }
}

