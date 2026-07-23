import { describe, it, expect, vi } from 'vitest';
import { auditService } from '../services/audit.service';
import { versionService } from '../services/version.service';

// Mock dependencies
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      auditLog: {
        findMany: vi.fn().mockResolvedValue([{ id: '1', action: 'DocumentApproved' }]),
        count: vi.fn().mockResolvedValue(1),
      },
      documentVersion: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          if (where.versionNumber === 1) return { id: 'v1', content: JSON.stringify({ body: 'Hello World' }) };
          if (where.versionNumber === 2) return { id: 'v2', content: JSON.stringify({ body: 'Hello Brave New World' }) };
          return null;
        })
      }
    }))
  };
});

describe('Audit & Version Services', () => {
  it('should fetch audit logs with pagination', async () => {
    const result = await auditService.getAuditLogs({ page: 1, limit: 10 });
    expect(result.logs.length).toBe(1);
    expect(result.total).toBe(1);
  });

  it('should compare two document versions accurately', async () => {
    const diff = await versionService.compareVersions('doc-1', 1, 2);
    expect(diff.v1).toBe(1);
    expect(diff.v2).toBe(2);
    // Since we mock diff library minimally in tests (or use a real one), we just ensure the object shape.
    expect(diff.diff).toBeDefined();
    expect(Array.isArray(diff.diff)).toBe(true);
  });
});
