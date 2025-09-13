import type { FastifyRequest, FastifyReply } from 'fastify';
import { CompanyPartyService } from '@/modules/company-parties/company-party.service.ts';
import type {
  CreateCompanyPartyInput,
  UpdateCompanyPartyInput,
  GetCompanyPartiesQuery,
  CompanyPartyParams,
  AddPlayerInput,
  PlayerParams,
} from './company-parties.schema.ts';

export class CompanyPartiesController {
  constructor(private companyPartyService: CompanyPartyService) {}

  async createCompanyParty(
    request: FastifyRequest<{ Body: CreateCompanyPartyInput }>,
    reply: FastifyReply
  ) {
    try {
      const companyParty = await this.companyPartyService.createCompanyParty(
        request.body
      );
      return reply.status(201).send(companyParty);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return reply.status(409).send({
            error: {
              message: error.message,
              statusCode: 409,
            },
          });
        }
      }
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async getCompanyParties(
    request: FastifyRequest<{ Querystring: GetCompanyPartiesQuery }>,
    reply: FastifyReply
  ) {
    try {
      const companyParties = await this.companyPartyService.getCompanyParties(
        request.query
      );
      return reply.status(200).send(companyParties);
    } catch (error) {
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async getCompanyPartyById(
    request: FastifyRequest<{ Params: CompanyPartyParams }>,
    reply: FastifyReply
  ) {
    try {
      const companyParty = await this.companyPartyService.getCompanyPartyById(
        request.params.id
      );

      if (!companyParty) {
        return reply.status(404).send({
          error: {
            message: 'Company Party not found',
            statusCode: 404,
          },
        });
      }

      return reply.status(200).send(companyParty);
    } catch (error) {
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async updateCompanyParty(
    request: FastifyRequest<{
      Params: CompanyPartyParams;
      Body: UpdateCompanyPartyInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const companyParty = await this.companyPartyService.updateCompanyParty(
        request.params.id,
        request.body
      );

      if (!companyParty) {
        return reply.status(404).send({
          error: {
            message: 'Company Party not found',
            statusCode: 404,
          },
        });
      }

      return reply.status(200).send(companyParty);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return reply.status(409).send({
            error: {
              message: error.message,
              statusCode: 409,
            },
          });
        }
      }
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async deleteCompanyParty(
    request: FastifyRequest<{ Params: CompanyPartyParams }>,
    reply: FastifyReply
  ) {
    try {
      const deleted = await this.companyPartyService.deleteCompanyParty(
        request.params.id
      );

      if (!deleted) {
        return reply.status(404).send({
          error: {
            message: 'Company Party not found',
            statusCode: 404,
          },
        });
      }

      return reply.status(204).send();
    } catch (error) {
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async addPlayerToCompanyParty(
    request: FastifyRequest<{
      Params: CompanyPartyParams;
      Body: AddPlayerInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const success = await this.companyPartyService.addPlayerToCompanyParty(
        request.params.id,
        request.body.userId
      );

      if (!success) {
        return reply.status(500).send({
          error: {
            message: 'Failed to add player to Company Party',
            statusCode: 500,
          },
        });
      }

      return reply.status(201).send({
        message: 'Player added to Company Party successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({
            error: {
              message: error.message,
              statusCode: 404,
            },
          });
        }
        if (error.message.includes('already a member')) {
          return reply.status(409).send({
            error: {
              message: error.message,
              statusCode: 409,
            },
          });
        }
      }
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async removePlayerFromCompanyParty(
    request: FastifyRequest<{ Params: PlayerParams }>,
    reply: FastifyReply
  ) {
    try {
      const success =
        await this.companyPartyService.removePlayerFromCompanyParty(
          request.params.id,
          request.params.playerId
        );

      if (!success) {
        return reply.status(500).send({
          error: {
            message: 'Failed to remove player from Company Party',
            statusCode: 500,
          },
        });
      }

      return reply.status(200).send({
        message: 'Player removed from Company Party successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({
            error: {
              message: error.message,
              statusCode: 404,
            },
          });
        }
        if (error.message.includes('not a member')) {
          return reply.status(409).send({
            error: {
              message: error.message,
              statusCode: 409,
            },
          });
        }
      }
      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }
}
