import type { FastifyRequest, FastifyReply } from 'fastify';
import { StorageService } from '@/modules/storage/storage.service.ts';
import { ValidationError } from '@/libs/errors.ts';

export class UploadController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Upload user inventory image
   * POST /upload/user-inventory-image
   * Authenticated users only
   */
  async uploadUserInventoryImage(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      console.log('[Upload] Starting file upload...');

      // Get uploaded file from multipart request
      const data = await request.file();

      console.log('[Upload] File received:', {
        filename: data?.filename,
        mimetype: data?.mimetype,
        encoding: data?.encoding,
      });

      if (!data) {
        console.log('[Upload] No file data received');
        return reply.status(400).send({
          error: {
            message: 'No file uploaded',
            statusCode: 400,
          },
        });
      }

      console.log('[Upload] Uploading to Contabo...');

      // Upload to Contabo Object Storage
      const imageUrl = await this.storageService.uploadUserInventoryImage(data);

      console.log('[Upload] Upload successful:', imageUrl);

      return reply.status(200).send({
        data: {
          imageUrl,
        },
        message: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('[Upload] Error occurred:', error);

      if (error instanceof ValidationError) {
        console.log('[Upload] Validation error:', error.message);
        return reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
          },
        });
      }

      console.error('[Upload] Unexpected error:', error);

      return reply.status(500).send({
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to upload image',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Upload user avatar image
   * POST /upload/user-avatar
   * Authenticated users only
   */
  async uploadUserAvatar(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      console.log('[Upload] Starting avatar upload...');

      const data = await request.file();

      console.log('[Upload] Avatar file received:', {
        filename: data?.filename,
        mimetype: data?.mimetype,
        encoding: data?.encoding,
      });

      if (!data) {
        console.log('[Upload] No avatar file data received');
        return reply.status(400).send({
          error: {
            message: 'No file uploaded',
            statusCode: 400,
          },
        });
      }

      console.log('[Upload] Uploading avatar to Contabo...');

      const imageUrl = await this.storageService.uploadUserAvatarImage(data);

      console.log('[Upload] Avatar upload successful:', imageUrl);

      return reply.status(200).send({
        data: {
          imageUrl,
        },
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      console.error('[Upload] Error occurred during avatar upload:', error);

      if (error instanceof ValidationError) {
        console.log('[Upload] Validation error:', error.message);
        return reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
          },
        });
      }

      console.error('[Upload] Unexpected avatar upload error:', error);

      return reply.status(500).send({
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to upload image',
          statusCode: 500,
        },
      });
    }
  }
}
