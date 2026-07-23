import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors';
import { config } from '../config';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export class AuthService {
  async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = randomBytes(40).toString('hex');

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt
      }
    });

    return { user, accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { refreshToken }
    });
  }

  async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new AuthenticationError('Session expired or invalid');
    }

    // Issue new access token
    const accessToken = this.generateAccessToken(session.user);
    
    // Rotate refresh token for security
    const newRefreshToken = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, expiresAt }
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  private generateAccessToken(user: User): string {
    return (jwt.sign as any)(
      { id: user.id, role: user.role, version: user.version },
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_EXPIRES_IN as string }
    );
  }
}

export const authService = new AuthService();
