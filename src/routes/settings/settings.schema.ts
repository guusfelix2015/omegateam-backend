import { z } from 'zod';

export const createSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').trim(),
  value: z.string().min(1, 'Value is required'),
});

export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export const upsertSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').trim(),
  value: z.string().min(1, 'Value is required'),
});

export const settingKeyParamSchema = z.object({
  key: z.string().min(1, 'Key is required'),
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
export type SettingKeyParams = z.infer<typeof settingKeyParamSchema>;

export interface SettingResponse {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsListResponse {
  data: SettingResponse[];
}

