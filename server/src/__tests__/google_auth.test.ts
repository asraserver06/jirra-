import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { createApp } from '../app.js';
import { Invitation } from '../models/Invitation.js';
import { Membership } from '../models/Membership.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { ENV } from '../config/env.js';
import { generateInviteToken } from '../utils/inviteToken.js';

const app = createApp();
const claims = {
  sub: 'google-subject-1',
  email: 'Google.User@example.com',
  email_verified: true,
  name: 'Google User',
  picture: 'https://example.com/google-user.png',
};

const verifyIdToken = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken');

describe('Google authentication', () => {
  beforeEach(() => {
    verifyIdToken.mockResolvedValue({ getPayload: () => claims } as never);
  });

  afterEach(() => {
    verifyIdToken.mockReset();
  });

  it('links a verified Google identity to an existing email account and logs in', async () => {
    const existingUser = await User.create({
      name: 'Existing User',
      email: 'google.user@example.com',
      password: 'password123',
    });
    const workspace = await Workspace.create({ name: 'Existing Workspace' });
    await Membership.create({ workspace: workspace._id, user: existingUser._id, role: 'admin' });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-google-credential' });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('google.user@example.com');
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.workspace).toBeUndefined();
    expect(JSON.stringify(response.headers['set-cookie'])).toContain('HttpOnly');

    const linkedUser = await User.findById(existingUser._id).select('+password');
    expect(linkedUser?.googleId).toBe(claims.sub);
    expect(linkedUser?.authProvider).toBe('google');
    expect(linkedUser?.avatar).toBe(claims.picture);
    expect(await linkedUser?.comparePassword('password123')).toBe(true);
    expect(await Workspace.countDocuments()).toBe(1);
  });

  it('returns a short-lived signup ticket without creating an unknown Google user', async () => {
    const availability = await request(app).get('/api/auth/google/status');
    expect(availability.status).toBe(200);
    expect(availability.body.data.enabled).toBe(true);

    const initialUserCount = await User.countDocuments();
    const response = await request(app)
      .post('/api/auth/google')
      .send({
        credential: 'valid-google-credential',
        workspaceName: 'Google Workspace',
        goal: 'Collaborate',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('needs_signup');
    expect(response.body.data.signupTicket).toBeDefined();
    expect(response.body.data.email).toBe('google.user@example.com');
    expect(response.body.data.name).toBe('Google User');
    expect(await User.countDocuments()).toBe(initialUserCount);
    expect(await Workspace.countDocuments()).toBe(0);
    const signupClaims = jwt.decode(response.body.data.signupTicket) as jwt.JwtPayload;
    expect(signupClaims.purpose).toBe('google_signup');
    expect(signupClaims.email).toBe('google.user@example.com');
    expect(signupClaims.name).toBe('Google User');
    expect(signupClaims.googleId).toBe('google-subject-1');
    expect(signupClaims.exp! - signupClaims.iat!).toBe(15 * 60);

    const invalidSignup = await request(app).post('/api/auth/signup').send({
      name: 'Google User',
      email: 'google.user@example.com',
      workspaceName: 'Google Workspace',
      googleSignupTicket: `${response.body.data.signupTicket}invalid`,
    });
    expect(invalidSignup.status).toBe(401);
    expect(await User.countDocuments()).toBe(initialUserCount);
    expect(await Workspace.countDocuments()).toBe(0);

    const signup = await request(app).post('/api/auth/signup').send({
      name: response.body.data.name,
      email: response.body.data.email,
      workspaceName: 'Google Workspace',
      goal: 'Collaborate',
      googleSignupTicket: response.body.data.signupTicket,
    });
    expect(signup.status).toBe(201);
    expect(signup.body.data.workspace.name).toBe('Google Workspace');
    expect(signup.body.data.workspace.goal).toBe('Collaborate');
    expect(signup.body.data.workspace.role).toBe('admin');
    const user = await User.findOne({ email: 'google.user@example.com' }).select('+password');
    expect(user?.authProvider).toBe('google');
    expect(user?.googleId).toBe(claims.sub);
    expect(user?.password).toBeUndefined();
    expect(await Membership.findOne({ user: user?._id, role: 'admin' })).toBeTruthy();
  });

  it('routes an unknown Google email with a pending invite to invitation acceptance without creating the user', async () => {
    const adminResponse = await request(app).post('/api/auth/signup').send({
      name: 'Workspace Admin',
      email: 'admin@example.com',
      password: 'password123',
    });
    const workspaceId = adminResponse.body.data.workspace.id;
    const { token, tokenHash } = generateInviteToken();
    const invite = await Invitation.create({
      workspace: workspaceId,
      email: 'google.user@example.com',
      role: 'member',
      invitedBy: adminResponse.body.data.user.id,
      tokenHash,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-google-credential', inviteToken: token });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('needs_invite');
    expect(response.body.data.inviteToken).toBe(token);
    expect(await User.findOne({ email: 'google.user@example.com' })).toBeNull();
    expect((await Invitation.findById(invite._id))?.status).toBe('pending');
    expect(await Workspace.countDocuments()).toBe(1);

    const accepted = await request(app).post('/api/invites/accept').send({
      token,
      name: 'Google User',
      password: 'password123',
    });
    expect(accepted.status).toBe(200);
    const member = await User.findOne({ email: 'google.user@example.com' });
    expect(await Membership.findOne({ workspace: workspaceId, user: member?._id, role: 'member' })).toBeTruthy();
  });

  it('rejects unverified Google emails without creating an account', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...claims, email_verified: false }),
    } as never);

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'unverified-google-credential' });

    expect(response.status).toBe(403);
    expect(await User.countDocuments()).toBe(0);
    expect(await Workspace.countDocuments()).toBe(0);
  });

  it('returns a friendly error when Google credential verification fails', async () => {
    verifyIdToken.mockRejectedValue(new Error('provider unavailable'));

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'invalid-google-credential' });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Google sign-in could not verify/i);
    expect(await User.countDocuments()).toBe(0);
    expect(await Workspace.countDocuments()).toBe(0);
  });

  it('keeps the Google endpoint unavailable, not the server, when its client ID is missing', async () => {
    const configuredClientId = ENV.GOOGLE_CLIENT_ID;
    ENV.GOOGLE_CLIENT_ID = '';
    try {
      const response = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-google-credential' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Google sign-in is not available/i);
      const availability = await request(app).get('/api/auth/google/status');
      expect(availability.body.data.enabled).toBe(false);
      await request(app).get('/api/health').expect(200);
    } finally {
      ENV.GOOGLE_CLIENT_ID = configuredClientId;
    }
  });

  it('handles concurrent unknown Google sign-ins without creating accounts or workspaces', async () => {
    const sendGoogleRequest = () =>
      request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-google-credential' });

    const [first, second] = await Promise.all([sendGoogleRequest(), sendGoogleRequest()]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.data.status).toBe('needs_signup');
    expect(second.body.data.status).toBe('needs_signup');
    expect(await User.countDocuments({ email: 'google.user@example.com' })).toBe(0);
    expect(await Workspace.countDocuments()).toBe(0);
    expect(await Membership.countDocuments({ role: 'admin' })).toBe(0);
  });
});
