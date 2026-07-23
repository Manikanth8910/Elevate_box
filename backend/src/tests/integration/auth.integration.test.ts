import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
let token = '';

describe('Auth Flow Integration', () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('secure_password_123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@system.local' },
      update: { passwordHash, role: 'ADMIN' },
      create: {
        email: 'admin@system.local',
        passwordHash,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN'
      }
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: 'admin@system.local' } });
    await prisma.$disconnect();
  });

  it('should login an Admin and return a JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@system.local', password: 'secure_password_123' });
    
    expect(res.status).toBe(200);
    expect(res.body.data?.accessToken).toBeDefined();
    token = res.body.data.accessToken;
  });

  it('should reject unauthorized access', async () => {
    const res = await request(app)
      .get('/api/v1/system/audit');
      
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('should allow authorized access with token', async () => {
    const res = await request(app)
      .get('/api/v1/system/audit')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.status).toBe(200);
  });
});
