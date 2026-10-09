import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Health & Miscellaneous Endpoint Tests', () => {
  // ─── Health Checks ────────────────────────────────────────────
  describe('Health endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.uptime).toBeDefined();
      expect(typeof res.body.data.uptime).toBe('number');
    });

    it('GET /api/health should return healthy status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });
  });

  // ─── 404 Fallback ─────────────────────────────────────────────
  describe('404 fallback', () => {
    it('should return 404 for unknown GET routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for unknown POST routes', async () => {
      const res = await request(app).post('/api/unknown').send({ test: true });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Security Headers (Helmet) ───────────────────────────────
  describe('Security headers', () => {
    it('should include security headers from Helmet', async () => {
      const res = await request(app).get('/health');

      // Helmet adds these by default
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  // ─── CORS ─────────────────────────────────────────────────────
  describe('CORS', () => {
    it('should allow requests from localhost:3000', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const res = await request(app)
        .options('/api/tickets/012345678901234567890123/status')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'PATCH')
        .set('Access-Control-Request-Headers', 'authorization,content-type,x-workspace-id');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-methods']).toContain('PATCH');
      expect(res.headers['access-control-allow-headers']).toContain('X-Workspace-Id');
    });
  });

  // ─── JSON Body Parsing ────────────────────────────────────────
  describe('Body parsing', () => {
    it('should handle JSON content type', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'test@test.com', password: 'test' }));

      // Should parse JSON properly even if credentials are wrong
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
