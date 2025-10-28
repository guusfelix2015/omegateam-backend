import type { PrismaClient } from '@prisma/client';

export interface InactivityCheckResult {
  markedInactive: number;
  users: Array<{ id: string; email: string }>;
}

/**
 * Serviço para gerenciar inatividade de usuários
 * Verifica usuários que não fizeram login por mais de X dias
 * e marca-os como inativos automaticamente
 */
export class UserInactivityService {
  constructor(private prisma: PrismaClient) { }

  /**
   * Marca usuários como inativos se não fizeram login há mais de X dias
   * @param inactiveDays Número de dias de inatividade (padrão: 7)
   * @returns Resultado com número de usuários marcados e lista deles
   */
  async markInactiveUsers(inactiveDays: number = 7): Promise<InactivityCheckResult> {
    try {
      // Calcular data limite (X dias atrás)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - inactiveDays);

      // Buscar usuários ativos que não fizeram login há mais de X dias
      const potentiallyInactiveUsers = await this.prisma.user.findMany({
        where: {
          isActive: true,
          lastLoginAt: {
            lt: limitDate, // lastLoginAt < limitDate
          },
          // Garantir que lastLoginAt não é null (usuários que nunca fizeram login não devem ser marcados)
          NOT: {
            lastLoginAt: null,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (potentiallyInactiveUsers.length === 0) {
        return {
          markedInactive: 0,
          users: [],
        };
      }

      // Atualizar status de todos os usuários inativos
      const updateResult = await this.prisma.user.updateMany({
        where: {
          id: {
            in: potentiallyInactiveUsers.map(u => u.id),
          },
        },
        data: {
          isActive: false,
        },
      });

      console.log(
        `[INATIVIDADE] ✅ ${updateResult.count} usuários marcados como inativos após ${inactiveDays} dias sem login`
      );

      // Log detalhado para auditoria
      potentiallyInactiveUsers.forEach(user => {
        console.log(`[INATIVIDADE] 👤 ${user.email} (ID: ${user.id.slice(-8)})`);
      });

      return {
        markedInactive: updateResult.count,
        users: potentiallyInactiveUsers,
      };
    } catch (error) {
      console.error('[INATIVIDADE] ❌ Erro ao verificar inatividade de usuários:', error);
      throw error;
    }
  }

  /**
   * Obtém lista de todos os usuários inativos (isActive: false)
   * @returns Lista de usuários inativos
   */
  async getInactiveUsersList(): Promise<Array<{
    id: string;
    email: string;
    name: string;
    lastLoginAt: Date | null;
  }>> {
    return this.prisma.user.findMany({
      where: {
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
      },
      orderBy: {
        lastLoginAt: 'desc',
      },
    });
  }

  /**
   * Obtém informações de último login de um usuário
   * @param userId ID do usuário
   * @returns Informações de último login ou null
   */
  async getUserLastLoginInfo(userId: string): Promise<{
    lastLoginAt: Date | null;
    daysSinceLastLogin: number | null;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastLoginAt: true,
      },
    });

    if (!user) {
      return null;
    }

    let daysSinceLastLogin: number | null = null;
    if (user.lastLoginAt) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - user.lastLoginAt.getTime());
      daysSinceLastLogin = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      lastLoginAt: user.lastLoginAt,
      daysSinceLastLogin,
    };
  }

  /**
   * Reativa um usuário (apenas para admins)
   * @param userId ID do usuário a reativar
   * @returns Usuário reativado
   */
  async reactivateUser(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    console.log(`[INATIVIDADE] 🔄 Usuário ${user.email} reativado`);

    return user;
  }

  /**
   * Obtém estatísticas de inatividade
   * @param inactiveDays Número de dias para considerar inativo
   * @returns Estatísticas de usuários inativos
   */
  async getInactivityStats(inactiveDays: number = 7): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersNeverLoggedIn: number;
    potentiallyInactiveUsers: number;
  }> {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - inactiveDays);

    const [totalUsers, activeUsers, inactiveUsers, usersNeverLoggedIn, potentiallyInactiveUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { isActive: true },
        }),
        this.prisma.user.count({
          where: { isActive: false },
        }),
        this.prisma.user.count({
          where: { lastLoginAt: null },
        }),
        this.prisma.user.count({
          where: {
            isActive: true,
            lastLoginAt: {
              lt: limitDate,
            },
            NOT: {
              lastLoginAt: null,
            },
          },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersNeverLoggedIn,
      potentiallyInactiveUsers,
    };
  }
}

