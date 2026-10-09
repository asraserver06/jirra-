import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { Membership } from '../models/Membership.js';
import { Workspace } from '../models/Workspace.js';

const app = createApp();
let workspaceId = '';
let authToken = '';

const request = (app: ReturnType<typeof createApp>) => {
  const agent = supertest(app);
  return {
    get: (url: string) => agent.get(url)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Workspace-Id', workspaceId),
  };
};

const createMember = async (name: string, email: string) => {
  const user = await User.create({ name, email, password: 'password123' });
  await Membership.create({ workspace: workspaceId, user: user._id, role: 'member' });
  return user;
};

const ticketData = (
  key: string,
  title: string,
  user: InstanceType<typeof User>,
  values: Partial<{ status: string; priority: string; storyPoints: number }> = {}
) => ({
  workspaceId,
  key,
  title,
  status: values.status || 'todo',
  priority: values.priority || 'medium',
  storyPoints: values.storyPoints ?? 3,
  assignee: user._id,
  reporter: user._id,
});

describe('Analytics API Integration Tests', () => {
  beforeEach(async () => {
    const admin = await supertest(app).post('/api/auth/signup').send({
      name: 'Analytics Admin',
      email: 'analytics-admin@example.com',
      password: 'password123',
      workspaceName: 'Analytics Test Workspace',
    });
    workspaceId = admin.body.data.workspace.id;
    authToken = admin.body.data.accessToken;
  });

  describe('GET /api/analytics/sprint', () => {
    it('should return zero metrics when no tickets exist', async () => {
      const res = await request(app).get('/api/analytics/sprint');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalTickets).toBe(0);
      expect(res.body.data.statusCounts.todo).toBe(0);
      expect(res.body.data.statusCounts.in_progress).toBe(0);
      expect(res.body.data.statusCounts.in_review).toBe(0);
      expect(res.body.data.statusCounts.done).toBe(0);
      expect(res.body.data.totalStoryPoints).toBe(0);
      expect(res.body.data.doneStoryPoints).toBe(0);
      expect(res.body.data.completionPercentage).toBe(0);
      expect(res.body.data.pointsPercentage).toBe(0);
    });

    it('should return workspace-only status and priority breakdowns', async () => {
      const user = await createMember('Analytics User', 'analytics@test.com');
      await Ticket.create([
        ticketData('PROJ-201', 'T1', user, { status: 'todo', priority: 'high', storyPoints: 3 }),
        ticketData('PROJ-202', 'T2', user, { status: 'in_progress', priority: 'medium', storyPoints: 5 }),
        ticketData('PROJ-203', 'T3', user, { status: 'in_review', priority: 'low', storyPoints: 2 }),
        ticketData('PROJ-204', 'T4', user, { status: 'done', priority: 'urgent', storyPoints: 8 }),
        ticketData('PROJ-205', 'T5', user, { status: 'done', priority: 'high', storyPoints: 5 }),
      ]);

      const res = await request(app).get('/api/analytics/sprint');
      expect(res.status).toBe(200);
      expect(res.body.data.totalTickets).toBe(5);
      expect(res.body.data.statusCounts).toEqual({ todo: 1, in_progress: 1, in_review: 1, done: 2 });
      expect(res.body.data.priorityCounts).toEqual({ urgent: 1, high: 2, medium: 1, low: 1 });
    });

    it('should calculate story points and percentages correctly', async () => {
      const user = await createMember('Points User', 'points@test.com');
      await Ticket.create([
        ticketData('PROJ-401', 'SP1', user, { storyPoints: 5 }),
        ticketData('PROJ-402', 'SP2', user, { status: 'done', storyPoints: 5 }),
        ticketData('PROJ-403', 'SP3', user, { status: 'done', storyPoints: 10 }),
      ]);

      const res = await request(app).get('/api/analytics/sprint');
      expect(res.body.data.totalStoryPoints).toBe(20);
      expect(res.body.data.doneStoryPoints).toBe(15);
      expect(res.body.data.completionPercentage).toBe(67);
      expect(res.body.data.pointsPercentage).toBe(75);
    });

    it('should include only this workspace in workload and ticket totals', async () => {
      const workerOne = await createMember('Worker 1', 'worker1@test.com');
      const workerTwo = await createMember('Worker 2', 'worker2@test.com');
      await Ticket.create([
        ticketData('PROJ-501', 'W1-1', workerOne, { storyPoints: 3 }),
        ticketData('PROJ-502', 'W1-2', workerOne, { storyPoints: 5 }),
        ticketData('PROJ-503', 'W2-1', workerTwo, { storyPoints: 8 }),
      ]);

      const otherWorkspace = await Workspace.create({ name: 'Other Analytics Workspace' });
      await Ticket.create({
        ...ticketData('PROJ-501', 'Foreign ticket', workerOne),
        workspaceId: otherWorkspace._id,
      });

      const res = await request(app).get('/api/analytics/sprint');
      expect(res.body.data.totalTickets).toBe(3);
      expect(res.body.data.assigneeWorkload).toHaveLength(2);
      const workerOneMetrics = res.body.data.assigneeWorkload.find((item: any) => item.user.name === 'Worker 1');
      const workerTwoMetrics = res.body.data.assigneeWorkload.find((item: any) => item.user.name === 'Worker 2');
      expect(workerOneMetrics.count).toBe(2);
      expect(workerOneMetrics.storyPoints).toBe(8);
      expect(workerTwoMetrics.count).toBe(1);
      expect(workerTwoMetrics.storyPoints).toBe(8);
    });

    it('requires authenticated workspace membership', async () => {
      const response = await supertest(app).get('/api/analytics/sprint');
      expect(response.status).toBe(401);
    });
  });
});
