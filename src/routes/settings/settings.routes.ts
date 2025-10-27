import type { FastifyPluginAsync } from 'fastify';
import { SettingsRepository } from '@/modules/settings/settings.repository.ts';
import { SettingsService } from '@/modules/settings/settings.service.ts';
import { SettingsController } from './settings.controller.ts';
import type {
  CreateSettingInput,
  UpdateSettingInput,
  UpsertSettingInput,
  SettingKeyParams,
} from './settings.schema.ts';

const settingsRoutes: FastifyPluginAsync = async fastify => {
  const settingsRepository = new SettingsRepository(fastify.prisma);
  const settingsService = new SettingsService(settingsRepository);
  const settingsController = new SettingsController(settingsService);

  // GET /settings - Get all settings (PUBLIC)
  fastify.get('/', {
    handler: async (request, reply) => {
      return settingsController.getAllSettings(request, reply);
    },
  });

  // GET /settings/:key - Get setting by key (PUBLIC)
  fastify.get<{ Params: SettingKeyParams }>('/:key', {
    handler: async (request, reply) => {
      return settingsController.getSettingByKey(request, reply);
    },
  });

  // POST /settings - Create new setting (ADMIN only)
  fastify.post<{ Body: CreateSettingInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return settingsController.createSetting(request, reply);
    },
  });

  // PUT /settings/:key - Update setting (ADMIN only)
  fastify.put<{
    Params: SettingKeyParams;
    Body: UpdateSettingInput;
  }>('/:key', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return settingsController.updateSetting(request, reply);
    },
  });

  // POST /settings/upsert - Upsert setting (ADMIN only)
  fastify.post<{ Body: UpsertSettingInput }>('/upsert', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return settingsController.upsertSetting(request, reply);
    },
  });

  // DELETE /settings/:key - Delete setting (ADMIN only)
  fastify.delete<{ Params: SettingKeyParams }>('/:key', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return settingsController.deleteSetting(request, reply);
    },
  });
};

export default settingsRoutes;

