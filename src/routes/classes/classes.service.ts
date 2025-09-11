import { PrismaClient } from '@prisma/client';
import type { Classe } from './classes.schema';

export class ClassesService {
  constructor(private prisma: PrismaClient) {}

  async getAllClasses(): Promise<Classe[]> {
    const classes = await this.prisma.classe.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return classes.map(classe => ({
      id: classe.id,
      name: classe.name,
      createdAt: classe.createdAt.toISOString(),
    }));
  }

  async getClasseById(id: string): Promise<Classe | null> {
    const classe = await this.prisma.classe.findUnique({
      where: { id },
    });

    if (!classe) {
      return null;
    }

    return {
      id: classe.id,
      name: classe.name,
      createdAt: classe.createdAt.toISOString(),
    };
  }
}
