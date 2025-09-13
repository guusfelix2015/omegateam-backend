import type { FastifyPluginAsync } from 'fastify';
import { CompanyPartiesController } from './company-parties.controller.ts';
import { CompanyPartyService } from '@/modules/company-parties/company-party.service.ts';
import { CompanyPartyRepository } from '@/modules/company-parties/company-party.repository.ts';
import {
  createCompanyPartyJsonSchema,
  updateCompanyPartyJsonSchema,
  getCompanyPartiesQueryJsonSchema,
  companyPartyResponseJsonSchema,
  companyPartiesListResponseJsonSchema,
  addPlayerJsonSchema,
  errorResponseJsonSchema,
  type CreateCompanyPartyInput,
  type UpdateCompanyPartyInput,
  type GetCompanyPartiesQuery,
  type CompanyPartyParams,
  type AddPlayerInput,
  type PlayerParams,
} from './company-parties.schema.ts';

// eslint-disable-next-line @typescript-eslint/require-await
const companyPartiesRoutes: FastifyPluginAsync = async fastify => {
  const companyPartyRepository = new CompanyPartyRepository(fastify.prisma);
  const companyPartyService = new CompanyPartyService(companyPartyRepository);
  const companyPartiesController = new CompanyPartiesController(
    companyPartyService
  );

  // GET /company-parties - List all company parties with pagination and search
  fastify.get<{ Querystring: GetCompanyPartiesQuery }>('/', {
    preValidation: [fastify.authenticate],
    schema: {
      description: '🏢 List all Company Parties with pagination and search',
      summary: 'Get Company Parties',
      tags: ['Company Parties'],
      querystring: getCompanyPartiesQueryJsonSchema,
      response: {
        200: {
          description: 'List of Company Parties retrieved successfully',
          ...companyPartiesListResponseJsonSchema,
        },
        401: {
          description: 'Unauthorized - Invalid or missing authentication token',
          ...errorResponseJsonSchema,
        },
        500: {
          description: 'Internal server error',
          ...errorResponseJsonSchema,
        },
      },
    },
    handler: async (request, reply) => {
      return companyPartiesController.getCompanyParties(request, reply);
    },
  });

  // GET /company-parties/:id - Get specific company party with player details
  fastify.get<{ Params: CompanyPartyParams }>('/:id', {
    preValidation: [fastify.authenticate],
    schema: {
      description:
        '🏢 Get specific Company Party with detailed player information',
      summary: 'Get Company Party by ID',
      tags: ['Company Parties'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Company Party unique identifier',
          },
        },
        required: ['id'],
      },
      response: {
        200: {
          description: 'Company Party details retrieved successfully',
          ...companyPartyResponseJsonSchema,
        },
        401: {
          description: 'Unauthorized - Invalid or missing authentication token',
          ...errorResponseJsonSchema,
        },
        404: {
          description: 'Company Party not found',
          ...errorResponseJsonSchema,
        },
        500: {
          description: 'Internal server error',
          ...errorResponseJsonSchema,
        },
      },
    },
    handler: async (request, reply) => {
      return companyPartiesController.getCompanyPartyById(request, reply);
    },
  });

  // POST /company-parties - Create new company party (ADMIN only)
  fastify.post<{ Body: CreateCompanyPartyInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    schema: {
      description: '🏢 Create a new Company Party (ADMIN only)',
      summary: 'Create Company Party',
      tags: ['Company Parties'],
      body: createCompanyPartyJsonSchema,
      response: {
        201: {
          description: 'Company Party created successfully',
          ...companyPartyResponseJsonSchema,
        },
        400: {
          description: 'Bad request - Invalid input data',
          ...errorResponseJsonSchema,
        },
        401: {
          description: 'Unauthorized - Invalid or missing authentication token',
          ...errorResponseJsonSchema,
        },
        403: {
          description: 'Forbidden - Admin access required',
          ...errorResponseJsonSchema,
        },
        409: {
          description: 'Conflict - Company Party name already exists',
          ...errorResponseJsonSchema,
        },
        500: {
          description: 'Internal server error',
          ...errorResponseJsonSchema,
        },
      },
    },
    handler: async (request, reply) => {
      return companyPartiesController.createCompanyParty(request, reply);
    },
  });

  // PUT /company-parties/:id - Update company party name (ADMIN only)
  fastify.put<{ Params: CompanyPartyParams; Body: UpdateCompanyPartyInput }>(
    '/:id',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: '🏢 Update Company Party information (ADMIN only)',
        summary: 'Update Company Party',
        tags: ['Company Parties'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',

              description: 'Company Party unique identifier',
            },
          },
          required: ['id'],
        },
        body: updateCompanyPartyJsonSchema,
        response: {
          200: {
            description: 'Company Party updated successfully',
            ...companyPartyResponseJsonSchema,
          },
          400: {
            description: 'Bad request - Invalid input data',
            ...errorResponseJsonSchema,
          },
          401: {
            description:
              'Unauthorized - Invalid or missing authentication token',
            ...errorResponseJsonSchema,
          },
          403: {
            description: 'Forbidden - Admin access required',
            ...errorResponseJsonSchema,
          },
          404: {
            description: 'Company Party not found',
            ...errorResponseJsonSchema,
          },
          409: {
            description: 'Conflict - Company Party name already exists',
            ...errorResponseJsonSchema,
          },
          500: {
            description: 'Internal server error',
            ...errorResponseJsonSchema,
          },
        },
      },
      handler: async (request, reply) => {
        return companyPartiesController.updateCompanyParty(request, reply);
      },
    }
  );

  // DELETE /company-parties/:id - Delete company party (ADMIN only)
  fastify.delete<{ Params: CompanyPartyParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    schema: {
      description:
        '🏢 Delete Company Party and remove all player associations (ADMIN only)',
      summary: 'Delete Company Party',
      tags: ['Company Parties'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',

            description: 'Company Party unique identifier',
          },
        },
        required: ['id'],
      },
      response: {
        204: {
          description: 'Company Party deleted successfully',
          type: 'null',
        },
        401: {
          description: 'Unauthorized - Invalid or missing authentication token',
          ...errorResponseJsonSchema,
        },
        403: {
          description: 'Forbidden - Admin access required',
          ...errorResponseJsonSchema,
        },
        404: {
          description: 'Company Party not found',
          ...errorResponseJsonSchema,
        },
        500: {
          description: 'Internal server error',
          ...errorResponseJsonSchema,
        },
      },
    },
    handler: async (request, reply) => {
      return companyPartiesController.deleteCompanyParty(request, reply);
    },
  });

  // POST /company-parties/:id/players - Add player to company party (ADMIN only)
  fastify.post<{ Params: CompanyPartyParams; Body: AddPlayerInput }>(
    '/:id/players',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: '👥 Add a player to Company Party (ADMIN only)',
        summary: 'Add Player to Company Party',
        tags: ['Company Parties'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',

              description: 'Company Party unique identifier',
            },
          },
          required: ['id'],
        },
        body: addPlayerJsonSchema,
        response: {
          201: {
            description: 'Player added to Company Party successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request - Invalid input data',
            ...errorResponseJsonSchema,
          },
          401: {
            description:
              'Unauthorized - Invalid or missing authentication token',
            ...errorResponseJsonSchema,
          },
          403: {
            description: 'Forbidden - Admin access required',
            ...errorResponseJsonSchema,
          },
          404: {
            description: 'Company Party or User not found',
            ...errorResponseJsonSchema,
          },
          409: {
            description:
              'Conflict - Player is already a member of this Company Party',
            ...errorResponseJsonSchema,
          },
          500: {
            description: 'Internal server error',
            ...errorResponseJsonSchema,
          },
        },
      },
      handler: async (request, reply) => {
        return companyPartiesController.addPlayerToCompanyParty(request, reply);
      },
    }
  );

  // DELETE /company-parties/:id/players/:playerId - Remove player from company party (ADMIN only)
  fastify.delete<{ Params: PlayerParams }>('/:id/players/:playerId', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    schema: {
      description: '👥 Remove a player from Company Party (ADMIN only)',
      summary: 'Remove Player from Company Party',
      tags: ['Company Parties'],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',

            description: 'Company Party unique identifier',
          },
          playerId: {
            type: 'string',

            description: 'Player (User) unique identifier',
          },
        },
        required: ['id', 'playerId'],
      },
      response: {
        200: {
          description: 'Player removed from Company Party successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: {
          description: 'Unauthorized - Invalid or missing authentication token',
          ...errorResponseJsonSchema,
        },
        403: {
          description: 'Forbidden - Admin access required',
          ...errorResponseJsonSchema,
        },
        404: {
          description: 'Company Party or User not found',
          ...errorResponseJsonSchema,
        },
        409: {
          description:
            'Conflict - Player is not a member of this Company Party',
          ...errorResponseJsonSchema,
        },
        500: {
          description: 'Internal server error',
          ...errorResponseJsonSchema,
        },
      },
    },
    handler: async (request, reply) => {
      return companyPartiesController.removePlayerFromCompanyParty(
        request,
        reply
      );
    },
  });
};

export default companyPartiesRoutes;
