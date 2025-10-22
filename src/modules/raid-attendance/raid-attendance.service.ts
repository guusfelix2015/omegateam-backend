import type { MultipartFile } from '@fastify/multipart';
import { RaidAttendanceRepository } from './raid-attendance.repository.ts';
import { RaidInstanceRepository } from '@/modules/raid-instances/raid-instance.repository.ts';
import { StorageService } from '@/modules/storage/storage.service.ts';
import { ValidationError, NotFoundError } from '@/libs/errors.ts';
import type { AttendanceConfirmationDTO } from './raid-attendance.repository.ts';

export interface ConfirmAttendanceResponse {
  confirmationId: string;
  raidInstanceId: string;
  participantId: string;
  imageUrl: string;
  uploadedAt: string;
}

export class RaidAttendanceService {
  constructor(
    private attendanceRepository: RaidAttendanceRepository,
    private raidInstanceRepository: RaidInstanceRepository,
    private storageService: StorageService
  ) { }

  async confirmAttendance(
    raidInstanceId: string,
    participantId: string,
    userId: string,
    userRole: string,
    imageFile: MultipartFile
  ): Promise<ConfirmAttendanceResponse> {
    // Validate raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(
      raidInstanceId
    );
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    // Check if raid is already audited
    if (raidInstance.isAudited) {
      throw new ValidationError(
        'Cannot confirm attendance for an audited raid'
      );
    }

    // Validate participant exists and belongs to this raid
    const participant = await this.raidInstanceRepository.findParticipantById(
      participantId
    );
    if (!participant || participant.raidInstanceId !== raidInstanceId) {
      throw new NotFoundError('Participant');
    }

    // Validate permissions: Players can only upload for themselves, Admins can upload for anyone
    if (userRole !== 'ADMIN' && participant.userId !== userId) {
      throw new ValidationError(
        'You can only confirm attendance for yourself'
      );
    }

    // Upload image to storage
    const imageUrl = await this.storageService.uploadRaidAttendanceImage(
      imageFile,
      raidInstanceId
    );

    // Create confirmation record
    const confirmation = await this.attendanceRepository.createConfirmation({
      raidInstanceId,
      participantId,
      userId,
      imageUrl,
    });

    return {
      confirmationId: confirmation.id,
      raidInstanceId: confirmation.raidInstanceId,
      participantId: confirmation.participantId,
      imageUrl: confirmation.imageUrl,
      uploadedAt: confirmation.uploadedAt.toISOString(),
    };
  }

  async getAttendanceConfirmations(
    raidInstanceId: string
  ): Promise<AttendanceConfirmationDTO[]> {
    return this.attendanceRepository.getAttendanceConfirmationsWithStatus(
      raidInstanceId
    );
  }

  async removeConfirmation(
    raidInstanceId: string,
    participantId: string
  ): Promise<void> {
    // Validate raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(
      raidInstanceId
    );
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    // Check if raid is already audited
    if (raidInstance.isAudited) {
      throw new ValidationError(
        'Cannot remove confirmation from an audited raid'
      );
    }

    // Validate confirmation exists
    const confirmation =
      await this.attendanceRepository.getConfirmationByParticipantId(
        participantId
      );
    if (!confirmation) {
      throw new NotFoundError('Attendance confirmation');
    }

    // Delete confirmation
    await this.attendanceRepository.deleteConfirmation(participantId);
  }

  async getAuditStatus(raidInstanceId: string) {
    // Validate raid instance exists
    const raidInstance = await this.raidInstanceRepository.findById(
      raidInstanceId
    );
    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    const confirmedCount =
      await this.attendanceRepository.getConfirmedParticipantCount(
        raidInstanceId
      );
    const totalCount =
      await this.attendanceRepository.getTotalParticipantCount(raidInstanceId);

    const confirmationPercentage =
      totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

    // Fetch admin name if raid is audited
    let auditedByName: string | null = null;
    if (raidInstance.auditedBy) {
      auditedByName = await this.attendanceRepository.getUserNameById(
        raidInstance.auditedBy
      );
    }

    return {
      raidInstanceId,
      isAudited: raidInstance.isAudited,
      auditedAt: raidInstance.auditedAt?.toISOString() ?? null,
      auditedBy: raidInstance.auditedBy ?? null,
      auditedByName,
      totalParticipants: totalCount,
      confirmedParticipants: confirmedCount,
      pendingParticipants: totalCount - confirmedCount,
      confirmationPercentage,
    };
  }
}

