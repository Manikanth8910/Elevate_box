import { PrismaClient } from '@prisma/client';

export class DocumentRepository {
  async create(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, data: any, authorId: string) {
    return await tx.document.create({
      data: {
        title: data.title,
        body: data.content,
        authorId: authorId,
        versions: {
          create: {
            versionNumber: 1,
            content: data.content,
          }
        }
      },
    });
  }

  async findById(tx: any, id: string) {
    return await tx.document.findUnique({ where: { id } });
  }

  async updateWithVersionCheck(tx: any, id: string, expectedVersion: number, data: any) {
    const result = await tx.document.updateMany({
      where: { id, version: expectedVersion },
      data: {
        ...data,
        version: { increment: 1 }
      }
    });

    if (result.count === 0) {
      throw new Error('Optimistic concurrency error: Document version mismatch');
    }

    return await this.findById(tx, id);
  }
}
