import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { Invitation } from '../models/Invitation.js';
import { Workspace } from '../models/Workspace.js';
import { Membership } from '../models/Membership.js';
import { generateInviteToken, hashInviteToken } from '../utils/inviteToken.js';

const app = createApp();

describe('Workspace Invitations & Admin Onboarding Flow', () => {
  const adminData = {
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.admin@taskflow.dev',
    password: 'securePassword123',
    confirmPassword: 'securePassword123',
    workspaceName: 'Cyberdyne Systems',
    goal: 'Manage team tasks and sprints',
  };

  describe('A. Admin Sign-Up Flow', () => {
    it('creates admin user, custom workspace, stores goal, and returns admin role', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(adminData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Sarah Connor');
      expect(res.body.data.user.email).toBe(adminData.email);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.workspace.name).toBe('Cyberdyne Systems');
      expect(res.body.data.workspace.goal).toBe('Manage team tasks and sprints');
      expect(res.body.data.workspace.role).toBe('admin');
      expect(res.body.data.accessToken).toBeDefined();

      // Check DB
      const ws = await Workspace.findById(res.body.data.workspace.id);
      expect(ws).toBeTruthy();
      expect(ws?.goal).toBe('Manage team tasks and sprints');

      const membership = await Membership.findOne({ workspace: ws?._id, user: res.body.data.user.id });
      expect(membership).toBeTruthy();
      expect(membership?.role).toBe('admin');
    });

    it('rejects signup when password and confirmPassword do not match', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ...adminData,
          email: 'mismatch@taskflow.dev',
          confirmPassword: 'differentPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects public member signup without an invite token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.member@taskflow.dev',
          password: 'password123',
          role: 'member',
        });

      expect(res.status).toBe(400); // Fails validator refinement
      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate email signup with 409', async () => {
      await request(app).post('/api/auth/signup').send(adminData);
      const res = await request(app).post('/api/auth/signup').send(adminData);
      expect(res.status).toBe(409);
    });
  });

  describe('B. Inviting Members (Admin Only & Access Control)', () => {
    it('allows Admin to invite team members with default role or custom role', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const adminToken = adminRes.body.data.accessToken;
      const workspaceId = adminRes.body.data.workspace.id;

      // Invite a member
      const inviteRes = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          emails: ['developer@taskflow.dev'],
          role: 'member',
        });

      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.data[0].status).toBe('success');
      expect(inviteRes.body.data[0].email).toBe('developer@taskflow.dev');
      // Token or tokenHash must NEVER be returned in API response
      expect(JSON.stringify(inviteRes.body)).not.toMatch(/tokenHash/);

      const invite = await Invitation.findOne({ workspace: workspaceId, email: 'developer@taskflow.dev' });
      expect(invite).toBeTruthy();
      expect(invite?.role).toBe('member');
      expect(invite?.status).toBe('pending');
      expect(invite?.tokenHash).toBeDefined();
    });

    it('blocks non-admin members from sending invites with 403', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const adminToken = adminRes.body.data.accessToken;
      const workspaceId = adminRes.body.data.workspace.id;

      // Create an invite and accept it as a regular member
      const { token, tokenHash } = generateInviteToken();
      await Invitation.create({
        workspace: workspaceId,
        email: 'regular.member@taskflow.dev',
        role: 'member',
        invitedBy: adminRes.body.data.user.id,
        tokenHash,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const memberAcceptRes = await request(app).post('/api/invites/accept').send({
        token,
        firstName: 'Regular',
        lastName: 'Member',
        password: 'memberPassword123',
      });
      const memberToken = memberAcceptRes.body.data.accessToken;

      // Regular member attempts to invite someone
      const forbiddenRes = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          emails: ['unauthorized@taskflow.dev'],
        });

      expect(forbiddenRes.status).toBe(403);
    });

    it('blocks duplicate pending invite for the same email and workspace', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const adminToken = adminRes.body.data.accessToken;
      const workspaceId = adminRes.body.data.workspace.id;

      await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails: ['dupe@taskflow.dev'] });

      // Second attempt
      const secondRes = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails: ['dupe@taskflow.dev'] });

      expect(secondRes.status).toBe(201);
      expect(secondRes.body.data[0].status).toBe('failed');
      expect(secondRes.body.data[0].reason).toMatch(/Pending invite already exists/i);
    });

    it('blocks inviting an existing workspace member', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const adminToken = adminRes.body.data.accessToken;
      const workspaceId = adminRes.body.data.workspace.id;

      // Attempt to invite the admin themselves
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails: [adminData.email] });

      expect(res.status).toBe(201);
      expect(res.body.data[0].status).toBe('failed');
      expect(res.body.data[0].reason).toMatch(/Already a member/i);
    });

    it('allows Admin to view pending invites, resend, and revoke', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const adminToken = adminRes.body.data.accessToken;
      const workspaceId = adminRes.body.data.workspace.id;

      await request(app)
        .post(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails: ['manage@taskflow.dev'] });

      // 1. Get pending invites
      const listRes = await request(app)
        .get(`/api/workspaces/${workspaceId}/invites`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      const inviteId = listRes.body.data[0].id;
      expect(listRes.body.data[0].email).toBe('manage@taskflow.dev');
      expect(JSON.stringify(listRes.body)).not.toMatch(/tokenHash/);

      // 2. Resend invite
      const resendRes = await request(app)
        .post(`/api/workspaces/${workspaceId}/invites/${inviteId}/resend`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resendRes.status).toBe(200);
      expect(resendRes.body.success).toBe(true);

      // 3. Revoke invite
      const revokeRes = await request(app)
        .delete(`/api/workspaces/${workspaceId}/invites/${inviteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.success).toBe(true);

      // Invite is now revoked
      const updatedInvite = await Invitation.findById(inviteId);
      expect(updatedInvite?.status).toBe('revoked');
    });
  });

  describe('C & D. Invite Token Validation & Acceptance Flow', () => {
    it('validates a valid invite token with GET /api/invites/validate', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const workspaceId = adminRes.body.data.workspace.id;

      const { token, tokenHash } = generateInviteToken();
      await Invitation.create({
        workspace: workspaceId,
        email: 'val.user@taskflow.dev',
        role: 'member',
        invitedBy: adminRes.body.data.user.id,
        tokenHash,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const validateRes = await request(app)
        .get('/api/invites/validate')
        .query({ token });

      expect(validateRes.status).toBe(200);
      expect(validateRes.body.success).toBe(true);
      expect(validateRes.body.data.email).toBe('val.user@taskflow.dev');
      expect(validateRes.body.data.workspaceName).toBe('Cyberdyne Systems');
      expect(validateRes.body.data.role).toBe('member');
    });

    it('rejects invalid or missing tokens with 404', async () => {
      const res = await request(app)
        .get('/api/invites/validate')
        .query({ token: '0123456789abcdef0123456789abcdef' });

      expect(res.status).toBe(404);
    });

    it('rejects revoked tokens with 400', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const workspaceId = adminRes.body.data.workspace.id;

      const { token, tokenHash } = generateInviteToken();
      await Invitation.create({
        workspace: workspaceId,
        email: 'revoked@taskflow.dev',
        role: 'member',
        invitedBy: adminRes.body.data.user.id,
        tokenHash,
        status: 'revoked',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const res = await request(app)
        .get('/api/invites/validate')
        .query({ token });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/revoked/i);
    });

    it('rejects expired tokens with 400', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const workspaceId = adminRes.body.data.workspace.id;

      const { token, tokenHash } = generateInviteToken();
      await Invitation.create({
        workspace: workspaceId,
        email: 'expired@taskflow.dev',
        role: 'member',
        invitedBy: adminRes.body.data.user.id,
        tokenHash,
        status: 'pending',
        expiresAt: new Date(Date.now() - 10000), // Expired
      });

      const res = await request(app)
        .get('/api/invites/validate')
        .query({ token });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('accepts invite, creates user, joins workspace, and marks invite accepted', async () => {
      const adminRes = await request(app).post('/api/auth/signup').send(adminData);
      const workspaceId = adminRes.body.data.workspace.id;

      const { token, tokenHash } = generateInviteToken();
      const invite = await Invitation.create({
        workspace: workspaceId,
        email: 'accept.me@taskflow.dev',
        role: 'member',
        invitedBy: adminRes.body.data.user.id,
        tokenHash,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const acceptRes = await request(app)
        .post('/api/invites/accept')
        .send({
          token,
          firstName: 'Miles',
          lastName: 'Dyson',
          password: 'dysonPassword123',
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.data.user.email).toBe('accept.me@taskflow.dev');
      expect(acceptRes.body.data.user.name).toBe('Miles Dyson');
      expect(acceptRes.body.data.workspace.role).toBe('member');
      expect(acceptRes.body.data.accessToken).toBeDefined();

      // Check DB
      const updatedInvite = await Invitation.findById(invite._id);
      expect(updatedInvite?.status).toBe('accepted');

      const membership = await Membership.findOne({
        workspace: workspaceId,
        user: acceptRes.body.data.user.id,
      });
      expect(membership).toBeTruthy();
      expect(membership?.role).toBe('member');

      // Attempting to accept again must fail
      const reuseRes = await request(app)
        .post('/api/invites/accept')
        .send({
          token,
          firstName: 'Miles',
          lastName: 'Dyson',
          password: 'dysonPassword123',
        });

      expect(reuseRes.status).toBe(400);
      expect(reuseRes.body.message).toMatch(/already been used/i);
    });
  });
});
