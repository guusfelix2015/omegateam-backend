import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/libs/env.ts';
import { ValidationError } from '@/libs/errors.ts';
import type { MultipartFile } from '@fastify/multipart';

export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    // Configure S3 client for Contabo Object Storage
    this.s3Client = new S3Client({
      region: env.CONTABO_REGION,
      endpoint: env.CONTABO_ENDPOINT,
      credentials: {
        accessKeyId: env.CONTABO_ACCESS_KEY_ID,
        secretAccessKey: env.CONTABO_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for S3-compatible services
    });

    this.bucketName = env.CONTABO_BUCKET_NAME;
    this.publicUrl = env.CONTABO_PUBLIC_URL;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: MultipartFile, buffer: Buffer): void {
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    // Validate file size using buffer length
    if (buffer.length > maxSize) {
      throw new ValidationError(
        `File size exceeds maximum allowed size of 20MB`
      );
    }

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ValidationError(
        `Invalid file type. Allowed types: JPG, PNG, WebP`
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalFilename: string, folder: string = 'user-inventory'): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';

    // Sanitize filename - remove special characters and extension
    const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename;
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .substring(0, 50);

    return `${folder}/${timestamp}-${randomId}-${sanitized}.${extension}`;
  }

  /**
   * Upload user inventory image to Contabo Object Storage
   */
  async uploadUserInventoryImage(file: MultipartFile): Promise<string> {
    try {
      console.log('[Storage] Reading file buffer...');
      console.log('[Storage] File info:', {
        filename: file.filename,
        mimetype: file.mimetype,
        encoding: file.encoding,
      });

      // Read file buffer first
      const buffer = await file.toBuffer();

      console.log('[Storage] Buffer read successfully, size:', buffer.length, 'bytes');

      // Validate file with buffer
      this.validateFile(file, buffer);

      console.log('[Storage] File validation passed');

      // Generate unique filename
      const filename = this.generateFilename(file.filename);

      console.log('[Storage] Generated filename:', filename);

      // Upload to S3
      // Note: Contabo Object Storage may not support ACL parameter
      // The bucket is already configured as public, so files will be publicly accessible
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.mimetype,
      });

      console.log('[Storage] Uploading to S3...', {
        bucket: this.bucketName,
        key: filename,
        size: buffer.length,
      });

      await this.s3Client.send(command);

      console.log('[Storage] S3 upload successful');

      // Construct public URL using the public URL from env
      // Format: https://usc1.contabostorage.com/f17d20fe9b504489b8e28ec0581ffd09:lineage-cp-omega/file-path
      const publicUrl = `${this.publicUrl}/${filename}`;

      console.log('[Storage] Public URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('[Storage] Validation error:', error.message);
        throw error;
      }

      // Log the error for debugging
      console.error('[Storage] Upload error:', error);

      // Log the full error details for debugging
      if (error && typeof error === 'object') {
        console.error('[Storage] Error details:', {
          name: (error as any).name,
          message: (error as any).message,
          code: (error as any).Code || (error as any).code,
          statusCode: (error as any).$metadata?.httpStatusCode,
          response: (error as any).$response,
        });
      }

      throw new Error(
        `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload raid attendance proof image to Contabo Object Storage
   */
  async uploadRaidAttendanceImage(
    file: MultipartFile,
    raidInstanceId: string
  ): Promise<string> {
    try {
      console.log('[Storage] Reading raid attendance file buffer...');
      console.log('[Storage] File info:', {
        filename: file.filename,
        mimetype: file.mimetype,
        encoding: file.encoding,
      });

      // Read file buffer first
      const buffer = await file.toBuffer();

      console.log('[Storage] Buffer read successfully, size:', buffer.length, 'bytes');

      // Validate file with buffer
      this.validateFile(file, buffer);

      console.log('[Storage] File validation passed');

      // Generate unique filename with raid instance ID
      const filename = this.generateFilename(
        file.filename,
        `raid-attendance/${raidInstanceId}`
      );

      console.log('[Storage] Generated filename:', filename);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.mimetype,
      });

      console.log('[Storage] Uploading raid attendance to S3...', {
        bucket: this.bucketName,
        key: filename,
        size: buffer.length,
      });

      await this.s3Client.send(command);

      console.log('[Storage] S3 upload successful');

      // Construct public URL
      const publicUrl = `${this.publicUrl}/${filename}`;

      console.log('[Storage] Public URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('[Storage] Validation error:', error.message);
        throw error;
      }

      console.error('[Storage] Upload error:', error);

      throw new Error(
        `Failed to upload attendance image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete image from storage (optional - for cleanup)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts.slice(-2).join('/'); // Get 'raid-items/filename.ext'

      // Note: DeleteObjectCommand would be used here if needed
      // For now, we'll keep images even if items are deleted
      console.log(`Image deletion requested for: ${filename}`);
    } catch (error) {
      console.error('Storage delete error:', error);
      // Don't throw - deletion is optional
    }
  }
}

