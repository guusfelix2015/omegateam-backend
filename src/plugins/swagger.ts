import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const swaggerPlugin: FastifyPluginAsync = async fastify => {
  // Swagger completely disabled to avoid logo.svg errors
  fastify.log.info('📚 Swagger disabled - API documentation not available');
  return Promise.resolve();
};

export default fp(swaggerPlugin, {
  name: 'swagger',
});
