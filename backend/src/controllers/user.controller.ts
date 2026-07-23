import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendResponse } from '../utils/response';
import { NotFoundError } from '../errors';

const prisma = new PrismaClient();

export class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        }
      });
      sendResponse(res, 200, 'Users retrieved', { users });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        }
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      sendResponse(res, 200, 'User retrieved', { user });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
