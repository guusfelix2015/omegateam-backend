import type { FastifyPluginAsync } from 'fastify';
import { ClassesService } from './classes.service';
import {
  classesListResponseSchema,
  classeResponseSchema,
} from './classes.schema';

// eslint-disable-next-line @typescript-eslint/require-await
const classesRoutes: FastifyPluginAsync = async fastify => {
  const classesService = new ClassesService(fastify.prisma);

  fastify.get('/', async (_request, reply) => {
    try {
      const classes = await classesService.getAllClasses();

      const response = classesListResponseSchema.parse({
        data: classes,
      });

      return reply.code(200).send(response);
    } catch (error) {
      fastify.log.error(
        {
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                }
              : error,
        },
        'Error fetching classes'
      );
      return reply.code(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const classe = await classesService.getClasseById(id);

      if (!classe) {
        return reply.code(404).send({
          error: {
            message: 'Class not found',
            statusCode: 404,
          },
        });
      }

      const response = classeResponseSchema.parse(classe);
      return reply.code(200).send(response);
    } catch (error) {
      fastify.log.error(
        {
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                }
              : error,
        },
        'Error fetching class'
      );
      return reply.code(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  });
};

export default classesRoutes;
