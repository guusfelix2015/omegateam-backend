import type { FastifyPluginAsync } from 'fastify';
import { CompanyPartiesController } from './company-parties.controller.ts';
import { CompanyPartyService } from '@/modules/company-parties/company-party.service.ts';
import { CompanyPartyRepository } from '@/modules/company-parties/company-party.repository.ts';
import {
  type CreateCompanyPartyInput,
  type UpdateCompanyPartyInput,
  type GetCompanyPartiesQuery,
  type CompanyPartyParams,
  type AddPlayerInput,
  type PlayerParams,
} from './company-parties.schema.ts';

const companyPartiesRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const companyPartyRepository = new CompanyPartyRepository(fastify.prisma);
  const companyPartyService = new CompanyPartyService(
    companyPartyRepository,
    fastify.prisma
  );
  const companyPartiesController = new CompanyPartiesController(
    companyPartyService
  );

  // GET /company-parties - List all company parties with pagination and search
  fastify.get<{ Querystring: GetCompanyPartiesQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return companyPartiesController.getCompanyParties(request, reply);
    },
  });

  // GET /company-parties/:id - Get specific company party with player details
  fastify.get<{ Params: CompanyPartyParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return companyPartiesController.getCompanyPartyById(request, reply);
    },
  });

  // POST /company-parties - Create new company party (ADMIN only)
  fastify.post<{ Body: CreateCompanyPartyInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return companyPartiesController.createCompanyParty(request, reply);
    },
  });

  // PUT /company-parties/:id - Update company party name (ADMIN only)
  fastify.put<{ Params: CompanyPartyParams; Body: UpdateCompanyPartyInput }>(
    '/:id',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
      handler: async (request, reply) => {
        return companyPartiesController.updateCompanyParty(request, reply);
      },
    }
  );

  // DELETE /company-parties/:id - Delete company party (ADMIN only)
  fastify.delete<{ Params: CompanyPartyParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return companyPartiesController.deleteCompanyParty(request, reply);
    },
  });

  // POST /company-parties/:id/players - Add player to company party (ADMIN only)
  fastify.post<{ Params: CompanyPartyParams; Body: AddPlayerInput }>(
    '/:id/players',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
      handler: async (request, reply) => {
        return companyPartiesController.addPlayerToCompanyParty(request, reply);
      },
    }
  );

  // DELETE /company-parties/:id/players/:playerId - Remove player from company party (ADMIN only)
  fastify.delete<{ Params: CompanyPartyParams & PlayerParams }>(
    '/:id/players/:playerId',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
      handler: async (request, reply) => {
        return companyPartiesController.removePlayerFromCompanyParty(
          request,
          reply
        );
      },
    }
  );
};

export default companyPartiesRoutes;
