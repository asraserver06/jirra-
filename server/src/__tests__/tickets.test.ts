import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import './setup.js';

const app = createApp();
let userId: string;
let authToken: string;
let createdTicketId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'QA Master',
    email: 'qa.master@jira.dev',
    password: 'password123',
    role: 'lead',
  });
  userId = user._id.toString();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qa.master@jira.dev', password: 'password123' });

  authToken = loginRes.body.data.accessToken;
});

describe('Ticket Lifecycle API Integration Tests', () => {
  it('should create a new ticket with valid schema and sequential key', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'End-to-End API Integration Coverage',
        description: '<p>Testing complete CRUD lifecycle across all columns.</p>',
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
    createdTicketId = res.body.data.id;
  });

  it('should reject ticket creation when required title is missing (Zod validation)', async () => {
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

  it('should retrieve list of tickets with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/tickets?limit=10&page=1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
  });

  it('should update ticket status from todo to in_progress', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('should add a discussion comment to a ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Reviewing automated PR changes.' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comments.length).toBeGreaterThan(0);
    expect(res.body.data.comments[0].text).toBe('Reviewing automated PR changes.');
  });

  it('should delete a ticket by id', async () => {
    const res = await request(app)
      .delete(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
