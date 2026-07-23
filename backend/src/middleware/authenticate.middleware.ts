import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors';
import { config } from '../config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (e) {
      throw new AuthenticationError('Token expired or invalid');
    }

    // Load full user context. 
    // In a high-traffic app, this could hit Redis instead of PG.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    if (user.version !== decoded.version) {
      // This forces re-login if user role/permissions were heavily modified (version bumped)
      throw new AuthenticationError('Token invalidated due to account changes');
    }

    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
