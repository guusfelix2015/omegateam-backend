import type { FastifyRequest, FastifyReply } from 'fastify';
import { RaidAttendanceService } from '@/modules/raid-attendance/raid-attendance.service.ts';
import { RaidAuditService } from '@/modules/raid-attendance/raid-audit.service.ts';
import { ValidationError, NotFoundError } from '@/libs/errors.ts';

export class RaidAttendanceController {
  constructor(
    private attendanceService: RaidAttendanceService,
    private auditService: RaidAuditService
  ) { }

  /**
   * POST /raid-instances/:id/attendance/confirm
   * Upload attendance proof image
   */
  async confirmAttendance(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const { id: raidInstanceId } = request.params;
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          error: {
            message: 'No file uploaded',
            statusCode: 400,
          },
        });
      }

      // Get participant ID from query or body
      const participantId = (request.query as any).participantId as string;
      if (!participantId) {
        return reply.status(400).send({
          error: {
            message: 'Participant ID is required',
            statusCode: 400,
          },
        });
      }

      const result = await this.attendanceService.confirmAttendance(
        raidInstanceId,
        participantId,
        request.user.id,
        request.user.role,
        file
      );

      return reply.status(201).send({
        data: result,
        message: 'Attendance confirmed successfully',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
          },
        });
      }

      if (error instanceof NotFoundError) {
        return reply.status(404).send({
          error: {
            message: error.message,
            statusCode: 404,
          },
        });
      }

      console.error('[RaidAttendance] Error:', error);
      return reply.status(500).send({
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to confirm attendance',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * GET /raid-instances/:id/attendance
   * Get attendance confirmations for a raid instance
   */
  async getAttendanceConfirmations(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const { id: raidInstanceId } = request.params;

      const confirmations =
        await this.attendanceService.getAttendanceConfirmations(raidInstanceId);

      return reply.status(200).send({
        data: confirmations,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({
          error: {
            message: error.message,
            statusCode: 404,
          },
        });
      }

      console.error('[RaidAttendance] Error:', error);
      return reply.status(500).send({
        error: {
          message: 'Failed to fetch attendance confirmations',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * DELETE /raid-instances/:id/attendance/:participantId
   * Remove attendance confirmation (admin only)
   */
  async removeConfirmation(
    request: FastifyRequest<{ Params: { id: string; participantId: string } }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const { id: raidInstanceId, participantId } = request.params;

      await this.attendanceService.removeConfirmation(
        raidInstanceId,
        participantId
      );

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
          },
        });
      }

      if (error instanceof NotFoundError) {
        return reply.status(404).send({
          error: {
            message: error.message,
            statusCode: 404,
          },
        });
      }

      console.error('[RaidAttendance] Error:', error);
      return reply.status(500).send({
        error: {
          message: 'Failed to remove confirmation',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * GET /raid-instances/:id/audit-status
   * Get audit status and confirmation summary
   */
  async getAuditStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const { id: raidInstanceId } = request.params;

      const status = await this.attendanceService.getAuditStatus(raidInstanceId);

      return reply.status(200).send({
        data: status,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({
          error: {
            message: error.message,
            statusCode: 404,
          },
        });
      }

      console.error('[RaidAttendance] Error:', error);
      return reply.status(500).send({
        error: {
          message: 'Failed to fetch audit status',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * POST /raid-instances/:id/audit
   * Mark raid as audited and trigger DKP distribution
   */
  async auditRaidInstance(
    request: FastifyRequest<{ Params: { id: string }; Body: { notes?: string } }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const { id: raidInstanceId } = request.params;
      const { notes } = request.body;

      const result = await this.auditService.auditRaidInstance(
        raidInstanceId,
        request.user.id,
        notes
      );

      return reply.status(200).send({
        data: result,
        message: 'Raid audited successfully and DKP distributed',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          error: {
            message: error.message,
            statusCode: 400,
          },
        });
      }

      if (error instanceof NotFoundError) {
        return reply.status(404).send({
          error: {
            message: error.message,
            statusCode: 404,
          },
        });
      }

      console.error('[RaidAttendance] Error:', error);
      return reply.status(500).send({
        error: {
          message: 'Failed to audit raid instance',
          statusCode: 500,
        },
      });
    }
  }
}

