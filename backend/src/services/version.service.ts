import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../errors';
import * as diff from 'diff'; // Requires diff library, will use simple diffing for now

const prisma = new PrismaClient();

export class VersionService {
  
  async getVersions(documentId: string) {
    return prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async getVersion(documentId: string, versionNumber: number) {
    const version = await prisma.documentVersion.findFirst({
      where: { documentId, versionNumber },
    });
    if (!version) throw new NotFoundError('Version not found');
    return version;
  }

  async compareVersions(documentId: string, v1Number: number, v2Number: number) {
    const [v1, v2] = await Promise.all([
      this.getVersion(documentId, v1Number),
      this.getVersion(documentId, v2Number)
    ]);

    const content1 = JSON.parse(v1.content);
    const content2 = JSON.parse(v2.content);

    // Perform a basic line-by-line diff on the body text
    const differences = diff.diffLines(content1.body || '', content2.body || '');

    return {
      v1: v1Number,
      v2: v2Number,
      diff: differences.map(part => ({
        value: part.value,
        added: part.added,
        removed: part.removed
      }))
    };
  }
}

export const versionService = new VersionService();
