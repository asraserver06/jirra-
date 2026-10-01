import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import './setup.js';

const app = createApp();

describe('Auth API Integration Tests', () => {
  const testUser = {
    name: 'Test Engineer',
    email: 'test.engineer@jira.dev',
    password: 'password123',
    role: 'developer',
  };

  it('should successfully register a new user with hashed password and tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject registration with a duplicate email address', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should successfully authenticate and return tokens on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.name).toBe(testUser.name);
  });

  it('should reject login with an invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
