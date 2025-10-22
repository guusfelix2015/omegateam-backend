import type { PrismaClient, RaidAttendanceConfirmation } from '@prisma/client';
import { ValidationError, NotFoundError } from '@/libs/errors.ts';

export interface CreateAttendanceConfirmationData {
  raidInstanceId: string;
  participantId: string;
  userId: string;
  imageUrl: string;
}

export interface AttendanceConfirmationDTO {
  participantId: string;
  userId: string;
  userName: string;
  userNickname: string;
  userAvatar: string | null;
  status: 'confirmed' | 'pending';
  imageUrl: string | null;
  uploadedAt: string | null;
}

export class RaidAttendanceRepository {
  constructor(private prisma: PrismaClient) { }

  async createConfirmation(
    data: CreateAttendanceConfirmationData
  ): Promise<RaidAttendanceConfirmation> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create the confirmation record
        const confirmation = await tx.raidAttendanceConfirmation.create({
          data,
        });

        // Update the participant's confirmation status
        await tx.raidParticipant.update({
          where: { id: data.participantId },
          data: { hasConfirmedAttendance: true },
        });

        return confirmation;
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint failed')
      ) {
        throw new ValidationError(
          'Participant has already confirmed attendance for this raid'
        );
      }
      throw error;
    }
  }

  async getConfirmationByParticipantId(
    participantId: string
  ): Promise<RaidAttendanceConfirmation | null> {
    return this.prisma.raidAttendanceConfirmation.findUnique({
      where: { participantId },
    });
  }

  async getConfirmationsByRaidInstance(
    raidInstanceId: string
  ): Promise<RaidAttendanceConfirmation[]> {
    return this.prisma.raidAttendanceConfirmation.findMany({
      where: { raidInstanceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getAttendanceConfirmationsWithStatus(
    raidInstanceId: string
  ): Promise<AttendanceConfirmationDTO[]> {
    const raidInstance = await this.prisma.raidInstance.findUnique({
      where: { id: raidInstanceId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatar: true,
              },
            },
            attendanceConfirmation: true,
          },
        },
      },
    });

    if (!raidInstance) {
      throw new NotFoundError('Raid instance');
    }

    return raidInstance.participants.map((participant) => ({
      participantId: participant.id,
      userId: participant.userId,
      userName: participant.user.name,
      userNickname: participant.user.nickname,
      userAvatar: participant.user.avatar,
      status: participant.attendanceConfirmation ? 'confirmed' : 'pending',
      imageUrl: participant.attendanceConfirmation?.imageUrl ?? null,
      uploadedAt: participant.attendanceConfirmation?.uploadedAt.toISOString() ?? null,
    }));
  }

  async deleteConfirmation(participantId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete the confirmation
      await tx.raidAttendanceConfirmation.delete({
        where: { participantId },
      });

      // Update the participant's confirmation status
      await tx.raidParticipant.update({
        where: { id: participantId },
        data: { hasConfirmedAttendance: false },
      });
    });
  }

  async getConfirmedParticipantCount(raidInstanceId: string): Promise<number> {
    return this.prisma.raidAttendanceConfirmation.count({
      where: { raidInstanceId },
    });
  }

  async getTotalParticipantCount(raidInstanceId: string): Promise<number> {
    return this.prisma.raidParticipant.count({
      where: { raidInstanceId },
    });
  }

  async getUserNameById(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user?.name ?? null;
  }
}

