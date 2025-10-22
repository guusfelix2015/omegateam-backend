import type { FastifyPluginAsync } from 'fastify';
import { RaidAttendanceController } from './raid-attendance.controller.ts';
import { RaidAttendanceService } from '@/modules/raid-attendance/raid-attendance.service.ts';
import { RaidAuditService } from '@/modules/raid-attendance/raid-audit.service.ts';
import { RaidAttendanceRepository } from '@/modules/raid-attendance/raid-attendance.repository.ts';
import { RaidInstanceRepository } from '@/modules/raid-instances/raid-instance.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { StorageService } from '@/modules/storage/storage.service.ts';

const raidAttendanceRoutes: FastifyPluginAsync = async (fastify) => {
  const attendanceRepository = new RaidAttendanceRepository(fastify.prisma);
  const raidInstanceRepository = new RaidInstanceRepository(fastify.prisma);
  const dkpRepository = new DkpRepository(fastify.prisma);
  const storageService = new StorageService();

  const attendanceService = new RaidAttendanceService(
    attendanceRepository,
    raidInstanceRepository,
    storageService
  );

  const auditService = new RaidAuditService(
    fastify.prisma,
    raidInstanceRepository,
    dkpRepository,
    attendanceRepository
  );

  const controller = new RaidAttendanceController(attendanceService, auditService);

  // POST /raid-instances/:id/attendance/confirm - Confirm attendance with image upload
  fastify.post<{ Params: { id: string } }>(
    '/:id/attendance/confirm',
    {
      preValidation: [fastify.authenticate],
    },
    async (request, reply) => {
      return controller.confirmAttendance(request, reply);
    }
  );

  // GET /raid-instances/:id/attendance - Get attendance confirmations
  fastify.get<{ Params: { id: string } }>(
    '/:id/attendance',
    {
      preValidation: [fastify.authenticate],
    },
    async (request, reply) => {
      return controller.getAttendanceConfirmations(request, reply);
    }
  );

  // DELETE /raid-instances/:id/attendance/:participantId - Remove confirmation (admin only)
  fastify.delete<{ Params: { id: string; participantId: string } }>(
    '/:id/attendance/:participantId',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request, reply) => {
      return controller.removeConfirmation(request, reply);
    }
  );

  // GET /raid-instances/:id/audit-status - Get audit status
  fastify.get<{ Params: { id: string } }>(
    '/:id/audit-status',
    {
      preValidation: [fastify.authenticate],
    },
    async (request, reply) => {
      return controller.getAuditStatus(request, reply);
    }
  );

  // POST /raid-instances/:id/audit - Audit raid and distribute DKP (admin only)
  fastify.post<{ Params: { id: string }; Body: { notes?: string } }>(
    '/:id/audit',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request, reply) => {
      return controller.auditRaidInstance(request, reply);
    }
  );
};

export default raidAttendanceRoutes;

