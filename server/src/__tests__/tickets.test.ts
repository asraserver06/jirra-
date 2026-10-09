import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';

const app = createApp();

/** Helper: seed a user and return { userId, authToken } */
async function seedUser(overrides: Partial<{ name: string; email: string; password: string; role: string }> = {}) {
  const userData = {
    name: overrides.name ?? 'QA Master',
    email: overrides.email ?? 'qa.master@jira.dev',
    password: overrides.password ?? 'password123',
    role: overrides.role ?? 'lead',
  };

  const user = await User.create(userData);
  const userId = user._id.toString();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });

  const authToken = loginRes.body.data.accessToken;
  return { userId, authToken };
}

describe('Ticket Lifecycle API Integration Tests', () => {
  let userId: string;
  let authToken: string;
  let createdTicketId: string;

  beforeEach(async () => {
    const seeded = await seedUser();
    userId = seeded.userId;
    authToken = seeded.authToken;
  });

  // ─── Create Ticket ───────────────────────────────────────────
  describe('POST /api/tickets', () => {
    it('should create a ticket with valid payload and sequential key', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'End-to-End API Integration Coverage',
          description: '<p>Testing complete CRUD lifecycle.</p>',
          status: 'todo',
          priority: 'high',
          type: 'task',
          storyPoints: 5,
          assignee: userId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toMatch(/^PROJ-\d+$/);
      expect(res.body.data.title).toBe('End-to-End API Integration Coverage');
      expect(res.body.data.status).toBe('todo');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.type).toBe('task');
      expect(res.body.data.storyPoints).toBe(5);
      expect(res.body.data.id).toBeDefined();
      createdTicketId = res.body.data.id;
    });

    it('should reject ticket creation when title is missing (Zod validation)', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing title ticket',
          assignee: userId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject ticket creation when assignee is missing', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Assignee Ticket',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should use default values for optional fields', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Minimal Ticket',
          assignee: userId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('todo');
      expect(res.body.data.priority).toBe('medium');
      expect(res.body.data.type).toBe('story');
      expect(res.body.data.storyPoints).toBe(3);
    });

    it('should increment PROJ key sequentially', async () => {
      const res1 = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'First Ticket', assignee: userId });

      const res2 = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Second Ticket', assignee: userId });

      const key1Num = parseInt(res1.body.data.key.replace('PROJ-', ''), 10);
      const key2Num = parseInt(res2.body.data.key.replace('PROJ-', ''), 10);

      expect(key2Num).toBe(key1Num + 1);
    });

    it('should reject ticket with invalid priority value', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Priority',
          assignee: userId,
          priority: 'super_critical',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject ticket with invalid status value', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Status',
          assignee: userId,
          status: 'archived',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject ticket with invalid type value', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Type',
          assignee: userId,
          type: 'feature_request',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get Tickets (List) ──────────────────────────────────────
  describe('GET /api/tickets', () => {
    it('should retrieve an empty list when no tickets exist', async () => {
      const res = await request(app).get('/api/tickets').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('should retrieve tickets with pagination metadata', async () => {
      // Create two tickets
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Ticket A', assignee: userId });
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Ticket B', assignee: userId });

      const res = await request(app).get('/api/tickets?limit=10&page=1').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should paginate correctly with limit=1', async () => {
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Paginate A', assignee: userId });
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Paginate B', assignee: userId });

      const page1 = await request(app).get('/api/tickets?limit=1&page=1').set('Authorization', `Bearer ${authToken}`);
      const page2 = await request(app).get('/api/tickets?limit=1&page=2').set('Authorization', `Bearer ${authToken}`);

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.data.length).toBe(1);
      expect(page2.body.data.length).toBe(1);
      expect(page1.body.pagination.totalPages).toBe(2);
      expect(page1.body.pagination.total).toBe(2);
      // Each page should have a different ticket (compare by title since id format varies with lean)
      expect(page1.body.data[0].title).not.toBe(page2.body.data[0].title);
    });

    it('should filter tickets by status', async () => {
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Todo Ticket', assignee: userId, status: 'todo' });
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Done Ticket', assignee: userId, status: 'done' });

      const res = await request(app).get('/api/tickets?status=done').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('done');
    });

    it('should filter tickets by priority', async () => {
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'High Prio', assignee: userId, priority: 'high' });
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Low Prio', assignee: userId, priority: 'low' });

      const res = await request(app).get('/api/tickets?priority=high').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('high');
    });

    it('should search tickets by title', async () => {
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Unique Searchable Title', assignee: userId });
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Another Ticket', assignee: userId });

      const res = await request(app).get('/api/tickets?search=Searchable').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Searchable');
    });

    it('should populate assignee details', async () => {
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Populated Ticket', assignee: userId });

      const res = await request(app).get('/api/tickets').set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data[0].assignee).toBeDefined();
      expect(res.body.data[0].assignee.name).toBe('QA Master');
      expect(res.body.data[0].assignee.email).toBe('qa.master@jira.dev');
    });
  });

  // ─── Get Ticket By ID ────────────────────────────────────────
  describe('GET /api/tickets/:id', () => {
    it('should retrieve a ticket by MongoDB ObjectId', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Detail Ticket', assignee: userId });

      const ticketId = createRes.body.data.id;
      const res = await request(app).get(`/api/tickets/${ticketId}`).set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Detail Ticket');
    });

    it('should retrieve a ticket by PROJ key', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Key Lookup', assignee: userId });

      const key = createRes.body.data.key;
      const res = await request(app).get(`/api/tickets/${key}`).set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.key).toBe(key);
    });

    it('should return 404 for non-existent ticket', async () => {
      const res = await request(app).get('/api/tickets/000000000000000000000000').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Update Ticket ───────────────────────────────────────────
  describe('PUT /api/tickets/:id', () => {
    it('should update a ticket\'s title and priority', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Original Title', assignee: userId });
      const ticketId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title', priority: 'urgent' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.priority).toBe('urgent');
    });

    it('should return 404 when updating a non-existent ticket', async () => {
      const res = await request(app)
        .put('/api/tickets/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  // ─── Update Ticket Status ────────────────────────────────────
  describe('PATCH /api/tickets/:id/status', () => {
    it('should update ticket status from todo to in_progress', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Status Update', assignee: userId });
      const ticketId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('should transition through the full workflow', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Full Flow', assignee: userId, status: 'todo' });
      const id = createRes.body.data.id;

      for (const nextStatus of ['in_progress', 'in_review', 'done']) {
        const res = await request(app)
          .patch(`/api/tickets/${id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: nextStatus });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(nextStatus);
      }
    });

    it('should reject an invalid status value', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Bad Status', assignee: userId });
      const ticketId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for status update on non-existent ticket', async () => {
      const res = await request(app)
        .patch('/api/tickets/000000000000000000000000/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'done' });

      expect(res.status).toBe(404);
    });
  });

  // ─── Comments ─────────────────────────────────────────────────
  describe('POST /api/tickets/:id/comments', () => {
    it('should add a comment to a ticket', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Commentable Ticket', assignee: userId });
      const ticketId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Reviewing automated PR changes.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments.length).toBe(1);
      expect(res.body.data.comments[0].text).toBe('Reviewing automated PR changes.');
      expect(res.body.data.comments[0].user).toBeDefined();
    });

    it('should add multiple comments to the same ticket', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Multi Comment', assignee: userId });
      const ticketId = createRes.body.data.id;

      await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'First comment' });

      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Second comment' });

      expect(res.body.data.comments.length).toBe(2);
    });

    it('should reject an empty comment', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Empty Comment', assignee: userId });
      const ticketId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: '' });

      expect(res.status).toBe(400);
    });

    it('should return 404 when commenting on a non-existent ticket', async () => {
      const res = await request(app)
        .post('/api/tickets/000000000000000000000000/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Ghost comment' });

      expect(res.status).toBe(404);
    });
  });

  // ─── Delete Ticket ────────────────────────────────────────────
  describe('DELETE /api/tickets/:id', () => {
    it('should delete a ticket by ID', async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Delete Me', assignee: userId });
      const ticketId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const getRes = await request(app).get(`/api/tickets/${ticketId}`).set('Authorization', `Bearer ${authToken}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 when deleting a non-existent ticket', async () => {
      const res = await request(app)
        .delete('/api/tickets/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
