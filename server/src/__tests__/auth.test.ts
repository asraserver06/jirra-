import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Auth API Integration Tests', () => {
  const testUser = {
    name: 'Test Engineer',
    email: 'test.engineer@jira.dev',
    password: 'password123',
    role: 'developer',
  };

  // ─── Registration ────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.role).toBe('developer');
      expect(res.body.data.user.id).toBeDefined();
      // Password should never leak in the response
      expect(res.body.data.user.password).toBeUndefined();
      // Tokens
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Refresh token set as HTTP-only cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toMatch(/refreshToken/);
    });

    it('should reject duplicate email registration with 409', async () => {
      // Register once
      await request(app).post('/api/auth/register').send(testUser);
      // Try again
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'noname@test.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bad Email', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Short Pass', email: 'short@test.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should default role to developer when not specified', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'NoRole', email: 'norole@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('developer');
    });

    it('should generate a default avatar when none provided', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'AvatarTest', email: 'avatar@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.avatar).toBeDefined();
      expect(res.body.data.user.avatar.length).toBeGreaterThan(0);
    });
  });

  // ─── Login ────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should authenticate with valid credentials', async () => {
      // Seed user first
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.email).toBe(testUser.email);
      // Password must NOT leak
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get Me (Authenticated Profile) ──────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return the authenticated user profile', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.name).toBe(testUser.name);
    });

    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject with an invalid/garbage token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally.invalid.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Token Refresh ────────────────────────────────────────────
  describe('POST /api/auth/refresh', () => {
    it('should return a new access token from a valid refresh token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      const refreshToken = regRes.body.data.refreshToken;

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject refresh with missing token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get All Users ────────────────────────────────────────────
  describe('GET /api/auth/users', () => {
    it('should return a list of all registered users', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      await request(app).post('/api/auth/register').send({
        ...testUser,
        name: 'Second User',
        email: 'second@test.com',
      });

      const res = await request(app).get('/api/auth/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should return an empty array when no users exist', async () => {
      const res = await request(app).get('/api/auth/users');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
