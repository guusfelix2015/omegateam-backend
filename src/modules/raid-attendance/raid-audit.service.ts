import type { PrismaClient } from '@prisma/client';
import { RaidInstanceRepository } from '@/modules/raid-instances/raid-instance.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { DkpCalculationService } from '@/modules/dkp/dkp-calculation.service.ts';
import { RaidAttendanceRepository } from './raid-attendance.repository.ts';
import { ValidationError, NotFoundError } from '@/libs/errors.ts';

export interface RaidAuditResult {
  raidInstanceId: string;
  isAudited: boolean;
  auditedAt: string;
  auditedBy: string;
  dkpDistributed: {
    totalParticipants: number;
    confirmedParticipants: number;
    totalDkpAwarded: number;
    participants: Array<{
      userId: string;
      dkpAwarded: number;
      hasConfirmedAttendance: boolean;
    }>;
  };
}

export class RaidAuditService {
  private dkpCalculationService: DkpCalculationService;

  constructor(
    private prisma: PrismaClient,
    private raidInstanceRepository: RaidInstanceRepository,
    private dkpRepository: DkpRepository,
    private attendanceRepository: RaidAttendanceRepository
  ) {
    this.dkpCalculationService = new DkpCalculationService();
  }

  async auditRaidInstance(
    raidInstanceId: string,
    adminId: string,
    notes?: string
  ): Promise<RaidAuditResult> {
    // Validate raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(
      raidInstanceId
    );
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    // Check if already audited
    if (raidInstance.isAudited) {
      throw new ValidationError('Raid instance is already audited');
    }

    // Get raid details
    const raid = await this.prisma.raid.findUnique({
      where: { id: raidInstance.raidId },
    });
    if (!raid) {
      throw new NotFoundError('Raid');
    }

    // Get all participants with their confirmation status
    const participants = await this.prisma.raidParticipant.findMany({
      where: { raidInstanceId },
      include: {
        user: {
          include: { classe: true },
        },
        attendanceConfirmation: true,
      },
    });

    if (participants.length === 0) {
      throw new ValidationError('Raid instance has no participants');
    }

    // Check if at least one participant confirmed
    const confirmedParticipants = participants.filter(
      (p) => p.attendanceConfirmation
    );
    if (confirmedParticipants.length === 0) {
      throw new ValidationError(
        'At least one participant must confirm attendance before auditing'
      );
    }

    // Perform audit and DKP distribution in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const dkpDistributionData: RaidAuditResult['dkpDistributed']['participants'] =
        [];
      let totalDkpAwarded = 0;

      // Award DKP only to confirmed participants
      for (const participant of confirmedParticipants) {
        const dkpResult = this.dkpCalculationService.calculateDkpForParticipant(
          raid.bossLevel,
          participant.gearScoreAtTime,
          participant.user.classe?.name
        );

        // Create DKP transaction
        await tx.dkpTransaction.create({
          data: {
            userId: participant.userId,
            type: 'RAID_REWARD',
            amount: dkpResult.dkpPoints,
            reason: `Raid completion: ${raid.name} (Audited)`,
            createdBy: adminId,
            raidInstanceId,
            classBonusApplied: dkpResult.classBonusApplied,
          },
        });

        // Update user DKP balance
        await tx.user.update({
          where: { id: participant.userId },
          data: {
            dkpPoints: {
              increment: dkpResult.dkpPoints,
            },
          },
        });

        totalDkpAwarded += dkpResult.dkpPoints;

        dkpDistributionData.push({
          userId: participant.userId,
          dkpAwarded: dkpResult.dkpPoints,
          hasConfirmedAttendance: true,
        });
      }

      // Add non-confirmed participants to the result (0 DKP)
      for (const participant of participants) {
        if (!participant.attendanceConfirmation) {
          dkpDistributionData.push({
            userId: participant.userId,
            dkpAwarded: 0,
            hasConfirmedAttendance: false,
          });
        }
      }

      // Mark raid as audited
      const auditedInstance = await tx.raidInstance.update({
        where: { id: raidInstanceId },
        data: {
          isAudited: true,
          auditedAt: new Date(),
          auditedBy: adminId,
        },
      });

      return {
        raidInstanceId: auditedInstance.id,
        isAudited: auditedInstance.isAudited,
        auditedAt: auditedInstance.auditedAt!.toISOString(),
        auditedBy: auditedInstance.auditedBy!,
        dkpDistributed: {
          totalParticipants: participants.length,
          confirmedParticipants: confirmedParticipants.length,
          totalDkpAwarded,
          participants: dkpDistributionData,
        },
      };
    });

    return result;
  }

  async canAuditRaid(raidInstanceId: string): Promise<boolean> {
    const raidInstance = await this.raidInstanceRepository.findById(
      raidInstanceId
    );
    if (!raidInstance) {
      return false;
    }

    if (raidInstance.isAudited) {
      return false;
    }

    const confirmedCount =
      await this.attendanceRepository.getConfirmedParticipantCount(
        raidInstanceId
      );

    return confirmedCount > 0;
  }
}

