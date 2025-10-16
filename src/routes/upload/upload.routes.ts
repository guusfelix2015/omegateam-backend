import type { FastifyPluginAsync } from 'fastify';
import { UploadController } from './upload.controller.ts';

const uploadRoutes: FastifyPluginAsync = async fastify => {
  const uploadController = new UploadController();

  // POST /upload/user-inventory-image - Upload user inventory image (Authenticated users)
  fastify.post('/user-inventory-image', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return uploadController.uploadUserInventoryImage(request, reply);
    },
  });
};

export default uploadRoutes;

