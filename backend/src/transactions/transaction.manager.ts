import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../errors';

const prisma = new PrismaClient();

export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class TransactionManager {
  /**
   * Executes a callback inside a database transaction.
   * If the callback throws, the transaction rolls back.
   */
  static async execute<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await prisma.$transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (error: any) {
      // Could enhance error mapping here (e.g. Prisma code -> ConflictError)
      if (error.code === 'P2025') {
        throw new DatabaseError('Record not found or optimistic locking failure');
      }
      throw error;
    }
  }
}
