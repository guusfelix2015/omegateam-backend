import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateSettingInput,
  UpdateSettingInput,
  UpsertSettingInput,
  SettingKeyParams,
} from './settings.schema.ts';
import type { SettingsService } from '@/modules/settings/settings.service.ts';

export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  async getAllSettings(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const settings = await this.settingsService.getAllSettings();
    return reply.status(200).send({ data: settings });
  }

  async getSettingByKey(
    request: FastifyRequest<{ Params: SettingKeyParams }>,
    reply: FastifyReply
  ) {
    const setting = await this.settingsService.getSettingByKey(
      request.params.key
    );
    return reply.status(200).send(setting);
  }

  async createSetting(
    request: FastifyRequest<{ Body: CreateSettingInput }>,
    reply: FastifyReply
  ) {
    const setting = await this.settingsService.createSetting(request.body);
    return reply.status(201).send(setting);
  }

  async updateSetting(
    request: FastifyRequest<{
      Params: SettingKeyParams;
      Body: UpdateSettingInput;
    }>,
    reply: FastifyReply
  ) {
    const setting = await this.settingsService.updateSetting(
      request.params.key,
      request.body
    );
    return reply.status(200).send(setting);
  }

  async upsertSetting(
    request: FastifyRequest<{ Body: UpsertSettingInput }>,
    reply: FastifyReply
  ) {
    const setting = await this.settingsService.upsertSetting(
      request.body.key,
      request.body.value
    );
    return reply.status(200).send(setting);
  }

  async deleteSetting(
    request: FastifyRequest<{ Params: SettingKeyParams }>,
    reply: FastifyReply
  ) {
    await this.settingsService.deleteSetting(request.params.key);
    return reply.status(200).send({
      message: 'Setting deleted successfully',
    });
  }
}

