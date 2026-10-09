import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { Invitation } from '../models/Invitation.js';
import { Membership } from '../models/Membership.js';
import { User } from '../models/User.js';
import { generateInviteToken } from '../utils/inviteToken.js';

const app = createApp();

describe('Auth API Integration Tests', () => {
  const testUser = {
    name: 'Test Engineer',
    email: 'test.engineer@jira.dev',
    password: 'password123',
  };

  describe('POST /api/auth/signup', () => {
    it('should create an admin, workspace, and return tokens', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.workspace.name).toBe("Test Engineer's Workspace");
      expect(res.body.data.workspace.role).toBe('admin');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeUndefined();
      const decoded = jwt.decode(res.body.data.accessToken, { complete: true });
      expect(decoded?.header.alg).toBe('HS256');
      expect((decoded?.payload as jwt.JwtPayload).exp! - (decoded?.payload as jwt.JwtPayload).iat!).toBe(15 * 60);
      expect(JSON.stringify(res.headers['set-cookie'])).toContain('HttpOnly');
      expect(JSON.stringify(res.headers['set-cookie'])).toContain('Max-Age=604800');

      const memberships = await Membership.find({ user: res.body.data.user.id });
      expect(memberships).toHaveLength(1);
      expect(memberships[0].role).toBe('admin');

      const tickets = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`)
        .set('X-Workspace-Id', res.body.data.workspace.id);
      expect(tickets.status).toBe(200);
      expect(tickets.body.data).toEqual([]);
    });

    it('should reject duplicate email registration with 409', async () => {
      await request(app).post('/api/auth/signup').send(testUser);
      const res = await request(app).post('/api/auth/signup').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'noname@test.com', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Bad Email', email: 'not-an-email', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Short Pass', email: 'short@test.com', password: '12345' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate with valid credentials', async () => {
      await request(app).post('/api/auth/signup').send(testUser);
      const res = await request(app)
        .post('/api/auth/login')
        .set('Authorization', 'Bearer stale.token.value')
        .send({ email: `  ${testUser.email.toUpperCase()}  `, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      await request(app).post('/api/auth/signup').send(testUser);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('uses the httpOnly refresh cookie to issue a new access token', async () => {
      const signup = await request(app).post('/api/auth/signup').send(testUser);
      const header = signup.headers['set-cookie'];
      const cookies = Array.isArray(header) ? header : [header];
      const refreshCookie = cookies.find((cookie) => cookie.startsWith('refreshToken=') && !cookie.startsWith('refreshToken=;'));
      expect(refreshCookie).toBeDefined();

      const refreshed = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie!.split(';')[0])
        .send({});

      expect(refreshed.status).toBe(200);
      expect(refreshed.body.data.accessToken).toBeDefined();
      expect(refreshed.body.data.refreshToken).toBeUndefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the authenticated user profile', async () => {
      const regRes = await request(app).post('/api/auth/signup').send(testUser);
      const token = regRes.body.data.accessToken;
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Workspace invites', () => {
    it('lets an admin invite a member and accept as a new user', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(testUser);
      const adminToken = adminRes.body.data.accessToken;
      const workspaceId = adminRes.body.data.workspace.id;

      const inviteRes = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails: ['member@example.com'] });

      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.data[0].status).toBe('success');
      expect(JSON.stringify(inviteRes.body)).not.toMatch(/tokenHash/);

      const invite = await Invitation.findOne({ email: 'member@example.com' });
      expect(invite).toBeTruthy();
      const { token } = generateInviteToken();
      invite!.tokenHash = (await import('../utils/inviteToken.js')).hashInviteToken(token);
      await invite!.save();

      const preview = await request(app).get('/api/invites/preview').query({ token });
      expect(preview.status).toBe(200);
      expect(preview.body.data.email).toBe('member@example.com');
      expect(preview.body.data.userExists).toBe(false);

      const accept = await request(app).post('/api/invites/accept').send({
        token,
        name: 'New Member',
        password: 'memberpass',
      });
      expect(accept.status).toBe(200);
      expect(accept.body.data.user.email).toBe('member@example.com');
      expect(accept.body.data.workspace.role).toBe('member');
      expect(accept.body.data.refreshToken).toBeUndefined();

      const members = await request(app)
        .get(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${accept.body.data.accessToken}`);
      expect(members.status).toBe(200);
      expect(members.body.data).toHaveLength(2);

      const member = await User.findOne({ email: 'member@example.com' }).select('+password');
      expect(member?.name).toBe('New Member');
      expect(member?.password).not.toBe('memberpass');
      expect(await member?.comparePassword('memberpass')).toBe(true);
    });

    it('rejects members from public signup using an existing email', async () => {
      await request(app).post('/api/auth/signup').send(testUser);
      const res = await request(app).post('/api/auth/signup').send(testUser);
      expect(res.status).toBe(409);
    });

    it('blocks members from inviting', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(testUser);
      const workspaceId = adminRes.body.data.workspace.id;
      const invite = await Invitation.create({
        workspace: workspaceId,
        email: 'blocked@example.com',
        role: 'member',
        invitedBy: adminRes.body.data.user.id,
        tokenHash: 'abc',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
      });
      const { token, tokenHash } = generateInviteToken();
      invite.tokenHash = tokenHash;
      await invite.save();

      const memberRes = await request(app).post('/api/invites/accept').send({
        token,
        name: 'Blocked',
        password: 'memberpass',
      });
      const memberToken = memberRes.body.data.accessToken;

      const forbidden = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ emails: ['another@example.com'] });
      expect(forbidden.status).toBe(403);
    });
  });
});
