import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { Sprint } from '../models/Sprint.js';

export const seedDatabase = async () => {
  await connectDB();
  console.log('🧹 Clearing existing database collections...');
  await User.deleteMany({});
  await Ticket.deleteMany({});
  await Sprint.deleteMany({});

  console.log('👥 Creating team users...');
  const users = await User.create([
    {
      name: 'Alex Morgan',
      email: 'alex.morgan@acme-jira.io',
      password: 'jira1234',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sarah Connor',
      email: 'sarah.connor@acme-jira.io',
      password: 'jira1234',
      role: 'lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@acme-jira.io',
      password: 'jira1234',
      role: 'developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@acme-jira.io',
      password: 'jira1234',
      role: 'developer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  ]);

  const [alex, sarah, marcus, elena] = users;

  console.log('🏃 Creating active Sprint...');
  await Sprint.create({
    name: 'Sprint 14 - Platform Architecture & Polish',
    goal: 'Deliver production Next.js frontend with shadcn/ui and robust Express + MongoDB backend with authentication.',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'active',
  });

  console.log('🎫 Creating realistic Jira tickets...');
  const ticketsData = [
    {
      key: 'PROJ-101',
      title: 'Implement JWT authentication with rotating refresh tokens',
      description: '<p>Secure API endpoints with <strong>short-lived JWT access tokens</strong> (15m) and rotating refresh tokens (7d) stored in HTTP-only cookies.</p><ul><li>Bcrypt password hashing with salt factor 12</li><li>Token revocation and expiry checks</li><li>Cross-origin CORS configuration with credentials</li></ul>',
      status: 'in_progress',
      priority: 'urgent',
      type: 'story',
      storyPoints: 5,
      assignee: alex._id,
      reporter: sarah._id,
      comments: [
        {
          user: sarah._id,
          text: 'Make sure the refresh token endpoint verifies token family reuse to prevent replay attacks.',
          createdAt: new Date(Date.now() - 3600000 * 5),
        },
      ],
    },
    {
      key: 'PROJ-102',
      title: 'Fix memory leak on WebSocket connection cleanup',
      description: '<p>Under high concurrency, disconnected clients retain memory pointers in the active subscriptions map. Ensure <code>ws.on("close")</code> removes all event listeners and clears interval timers.</p>',
      status: 'todo',
      priority: 'high',
      type: 'bug',
      storyPoints: 3,
      assignee: marcus._id,
      reporter: alex._id,
      comments: [],
    },
    {
      key: 'PROJ-103',
      title: 'Migrate UI components to accessible Radix & shadcn/ui',
      description: '<p>Replace legacy dropdowns and modal dialogs with standard <strong>Radix UI</strong> primitives and Tailwind tokens. Test keyboard navigation with <code>Tab</code>, <code>Escape</code>, and arrow keys.</p>',
      status: 'in_review',
      priority: 'high',
      type: 'story',
      storyPoints: 8,
      assignee: sarah._id,
      reporter: marcus._id,
      comments: [
        {
          user: alex._id,
          text: 'Verified ARIA accessibility tags and focus trap inside Dialog modal. Looks super crisp!',
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
      ],
    },
    {
      key: 'PROJ-104',
      title: 'Setup automated CI/CD pipeline with GitHub Actions',
      description: '<p>Configure workflow file <code>.github/workflows/ci.yml</code> to run linting, TypeScript compilation, backend Vitest tests, and client build on every pull request.</p>',
      status: 'done',
      priority: 'medium',
      type: 'task',
      storyPoints: 5,
      assignee: elena._id,
      reporter: alex._id,
      comments: [
        {
          user: elena._id,
          text: 'CI pipeline verified green on main branch!',
          createdAt: new Date(Date.now() - 3600000 * 24),
        },
      ],
    },
    {
      key: 'PROJ-105',
      title: 'Add MongoDB compound indexes for sprint velocity queries',
      description: '<p>Add index on <code>{ status: 1, priority: 1, createdAt: -1 }</code> to optimize pagination and board filtering. Run <code>explain("executionStats")</code> to verify totalKeysExamined drops from COLLSCAN.</p>',
      status: 'done',
      priority: 'medium',
      type: 'task',
      storyPoints: 3,
      assignee: alex._id,
      reporter: alex._id,
      comments: [],
    },
    {
      key: 'PROJ-106',
      title: 'Design Dark Mode theme tokens using CSS HSL variables',
      description: '<p>Integrate <code>next-themes</code> with Atlassian dark mode palette. Support seamless toggle without flash of unstyled theme on page load.</p>',
      status: 'in_review',
      priority: 'medium',
      type: 'story',
      storyPoints: 5,
      assignee: sarah._id,
      reporter: marcus._id,
      comments: [],
    },
    {
      key: 'PROJ-107',
      title: 'Validate all API writes with Zod schemas at the edge',
      description: '<p>Ensure every POST, PUT, and PATCH request is strictly validated via Zod middleware before touching controllers or database layers. Return standardized 400 Bad Request error envelopes.</p>',
      status: 'done',
      priority: 'high',
      type: 'task',
      storyPoints: 5,
      assignee: marcus._id,
      reporter: sarah._id,
      comments: [],
    },
    {
      key: 'PROJ-108',
      title: 'Implement drag and drop Kanban column transitions',
      description: '<p>Provide intuitive drag and drop for moving ticket cards between TO DO, IN PROGRESS, IN REVIEW, and DONE with optimistic UI updates in Redux Toolkit.</p>',
      status: 'in_progress',
      priority: 'high',
      type: 'story',
      storyPoints: 5,
      assignee: elena._id,
      reporter: sarah._id,
      comments: [],
    },
    {
      key: 'PROJ-109',
      title: 'Write comprehensive integration tests with Supertest and Vitest',
      description: '<p>Cover authentication (register, login, bad password, token refresh) and ticket lifecycle (create, fetch with filters, update status, delete) with in-memory database.</p>',
      status: 'done',
      priority: 'high',
      type: 'task',
      storyPoints: 5,
      assignee: alex._id,
      reporter: elena._id,
      comments: [],
    },
    {
      key: 'PROJ-110',
      title: 'Sprint burndown and team velocity analytics dashboard',
      description: '<p>Interactive charts displaying completed story points, percentage of sprint done, and workload allocation per team member.</p>',
      status: 'in_progress',
      priority: 'medium',
      type: 'story',
      storyPoints: 5,
      assignee: sarah._id,
      reporter: alex._id,
      comments: [],
    },
    {
      key: 'PROJ-111',
      title: 'Dockerize Express REST API with multi-stage build',
      description: '<p>Create optimized production <code>Dockerfile</code> and <code>docker-compose.yml</code> exposing API on port 5000 and linking MongoDB volume.</p>',
      status: 'done',
      priority: 'medium',
      type: 'task',
      storyPoints: 3,
      assignee: elena._id,
      reporter: alex._id,
      comments: [],
    },
    {
      key: 'PROJ-112',
      title: 'Sanitize user inputs against NoSQL operator injection',
      description: '<p>Prevent malicious queries containing <code>$gt</code>, <code>$where</code>, or object pollution keys in query and body payloads.</p>',
      status: 'done',
      priority: 'urgent',
      type: 'bug',
      storyPoints: 2,
      assignee: alex._id,
      reporter: elena._id,
      comments: [],
    },
    {
      key: 'PROJ-113',
      title: 'Build rich text WYSIWYG editor for issue descriptions',
      description: '<p>Support bold, italics, code blocks, bulleted lists, font family selection, and text alignment with clean HTML output.</p>',
      status: 'done',
      priority: 'medium',
      type: 'story',
      storyPoints: 5,
      assignee: marcus._id,
      reporter: sarah._id,
      comments: [],
    },
    {
      key: 'PROJ-114',
      title: 'Setup Sentry error monitoring and performance tracing',
      description: '<p>Wire Sentry SDK in production environment to capture unhandled exceptions with breadcrumbs and release tracking.</p>',
      status: 'todo',
      priority: 'low',
      type: 'task',
      storyPoints: 2,
      assignee: elena._id,
      reporter: alex._id,
      comments: [],
    },
  ];

  for (const t of ticketsData) {
    await Ticket.create(t);
  }

  console.log(`✅ Successfully seeded ${ticketsData.length} tickets and 4 team users!`);
  console.log('🔑 Demo User Accounts:');
  console.log('   - alex.morgan@acme-jira.io (Password: jira1234, Role: admin)');
  console.log('   - sarah.connor@acme-jira.io (Password: jira1234, Role: lead)');
  console.log('   - marcus.vance@acme-jira.io (Password: jira1234, Role: developer)');
  console.log('   - elena.rostova@acme-jira.io (Password: jira1234, Role: developer)');
};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
