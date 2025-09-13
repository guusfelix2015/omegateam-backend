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
  const companyPartyRepository = new CompanyPartyRepository(fastify.prisma);
  const companyPartyService = new CompanyPartyService(companyPartyRepository);
  const companyPartiesController = new CompanyPartiesController(
    companyPartyService
  );

  fastify.get<{ Querystring: GetCompanyPartiesQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return companyPartiesController.getCompanyParties(request, reply);
    },
  });

  fastify.get<{ Params: CompanyPartyParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return companyPartiesController.getCompanyPartyById(request, reply);
    },
  });

  fastify.post<{ Body: CreateCompanyPartyInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return companyPartiesController.createCompanyParty(request, reply);
    },
  });

  fastify.put<{
    Params: CompanyPartyParams;
    Body: UpdateCompanyPartyInput;
  }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return companyPartiesController.updateCompanyParty(request, reply);
    },
  });

  fastify.delete<{ Params: CompanyPartyParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return companyPartiesController.deleteCompanyParty(request, reply);
    },
  });

  fastify.post<{ Params: CompanyPartyParams; Body: AddPlayerInput }>(
    '/:id/players',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
      handler: async (request, reply) => {
        return companyPartiesController.addPlayerToCompanyParty(request, reply);
      },
    }
  );

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
