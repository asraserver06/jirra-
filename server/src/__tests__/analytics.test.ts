import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';

const app = createApp();

describe('Analytics API Integration Tests', () => {
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

    it('should return correct status breakdown for mixed tickets', async () => {
      const user = await User.create({
        name: 'Analytics User',
        email: 'analytics@test.com',
        password: 'password123',
      });

      await Ticket.create([
        { key: 'PROJ-201', title: 'T1', status: 'todo', priority: 'high', storyPoints: 3, assignee: user._id, reporter: user._id },
        { key: 'PROJ-202', title: 'T2', status: 'in_progress', priority: 'medium', storyPoints: 5, assignee: user._id, reporter: user._id },
        { key: 'PROJ-203', title: 'T3', status: 'in_review', priority: 'low', storyPoints: 2, assignee: user._id, reporter: user._id },
        { key: 'PROJ-204', title: 'T4', status: 'done', priority: 'urgent', storyPoints: 8, assignee: user._id, reporter: user._id },
        { key: 'PROJ-205', title: 'T5', status: 'done', priority: 'high', storyPoints: 5, assignee: user._id, reporter: user._id },
      ]);

      const res = await request(app).get('/api/analytics/sprint');

      expect(res.status).toBe(200);
      expect(res.body.data.totalTickets).toBe(5);
      expect(res.body.data.statusCounts.todo).toBe(1);
      expect(res.body.data.statusCounts.in_progress).toBe(1);
      expect(res.body.data.statusCounts.in_review).toBe(1);
      expect(res.body.data.statusCounts.done).toBe(2);
    });

    it('should return correct priority breakdown', async () => {
      const user = await User.create({
        name: 'Priority User',
        email: 'priority@test.com',
        password: 'password123',
      });

      await Ticket.create([
        { key: 'PROJ-301', title: 'P1', status: 'todo', priority: 'urgent', storyPoints: 1, assignee: user._id, reporter: user._id },
        { key: 'PROJ-302', title: 'P2', status: 'todo', priority: 'high', storyPoints: 2, assignee: user._id, reporter: user._id },
        { key: 'PROJ-303', title: 'P3', status: 'todo', priority: 'medium', storyPoints: 3, assignee: user._id, reporter: user._id },
        { key: 'PROJ-304', title: 'P4', status: 'todo', priority: 'low', storyPoints: 4, assignee: user._id, reporter: user._id },
      ]);

      const res = await request(app).get('/api/analytics/sprint');

      expect(res.body.data.priorityCounts.urgent).toBe(1);
      expect(res.body.data.priorityCounts.high).toBe(1);
      expect(res.body.data.priorityCounts.medium).toBe(1);
      expect(res.body.data.priorityCounts.low).toBe(1);
    });

    it('should calculate story points and percentages correctly', async () => {
      const user = await User.create({
        name: 'Points User',
        email: 'points@test.com',
        password: 'password123',
      });

      await Ticket.create([
        { key: 'PROJ-401', title: 'SP1', status: 'todo', priority: 'medium', storyPoints: 5, assignee: user._id, reporter: user._id },
        { key: 'PROJ-402', title: 'SP2', status: 'done', priority: 'medium', storyPoints: 5, assignee: user._id, reporter: user._id },
        { key: 'PROJ-403', title: 'SP3', status: 'done', priority: 'medium', storyPoints: 10, assignee: user._id, reporter: user._id },
      ]);

      const res = await request(app).get('/api/analytics/sprint');

      expect(res.body.data.totalStoryPoints).toBe(20);
      expect(res.body.data.doneStoryPoints).toBe(15);
      // 2 out of 3 done = 67%
      expect(res.body.data.completionPercentage).toBe(67);
      // 15 out of 20 points = 75%
      expect(res.body.data.pointsPercentage).toBe(75);
    });

    it('should include assignee workload distribution', async () => {
      const user1 = await User.create({
        name: 'Worker 1',
        email: 'worker1@test.com',
        password: 'password123',
      });
      const user2 = await User.create({
        name: 'Worker 2',
        email: 'worker2@test.com',
        password: 'password123',
      });

      await Ticket.create([
        { key: 'PROJ-501', title: 'W1-1', status: 'todo', priority: 'medium', storyPoints: 3, assignee: user1._id, reporter: user1._id },
        { key: 'PROJ-502', title: 'W1-2', status: 'todo', priority: 'medium', storyPoints: 5, assignee: user1._id, reporter: user1._id },
        { key: 'PROJ-503', title: 'W2-1', status: 'todo', priority: 'medium', storyPoints: 8, assignee: user2._id, reporter: user2._id },
      ]);

      const res = await request(app).get('/api/analytics/sprint');

      expect(res.body.data.assigneeWorkload).toBeDefined();
      expect(Array.isArray(res.body.data.assigneeWorkload)).toBe(true);
      expect(res.body.data.assigneeWorkload.length).toBe(2);

      // Find each worker
      const w1 = res.body.data.assigneeWorkload.find(
        (w: any) => w.user.name === 'Worker 1'
      );
      const w2 = res.body.data.assigneeWorkload.find(
        (w: any) => w.user.name === 'Worker 2'
      );

      expect(w1.count).toBe(2);
      expect(w1.storyPoints).toBe(8);
      expect(w2.count).toBe(1);
      expect(w2.storyPoints).toBe(8);
    });

    it('should include a sprint name in the response', async () => {
      const res = await request(app).get('/api/analytics/sprint');

      expect(res.body.data.sprintName).toBeDefined();
      expect(typeof res.body.data.sprintName).toBe('string');
    });
  });
});
