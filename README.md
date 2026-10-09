# 🚀 Jira Cloud Full-Stack Agile Platform

A production-grade, full-stack clone of **Atlassian Jira**, engineered with **Next.js 15 (App Router)**, **shadcn/ui**, **Redux Toolkit**, and a decoupled **Express.js REST API** backed by **MongoDB & Mongoose**.

---

## 📐 Architecture Overview

```mermaid
graph TD
    subgraph Client ["Frontend (Next.js 15 App Router & shadcn/ui)"]
        UI["UI Layer<br/>(Tailwind CSS + shadcn/ui + Radix UI)"]
        RTK["Redux Toolkit Client Store<br/>(TicketsSlice, AuthSlice, UISlice)"]
        Proxy["Next.js API Proxy / Rewrites<br/>(/api/v1/* -> :5000)"]
        Pages["App Router Screens<br/>/board, /list, /dashboard, /tickets/:id, /login, /register"]
    end

    subgraph Server ["Backend (Express REST API)"]
        MW["Security Middlewares<br/>(Helmet, RateLimit, CORS, JWT Auth, NoSQL Sanitize)"]
        Zod["Edge Validation<br/>(Zod Schemas on writes & queries)"]
        Controllers["Controllers & Services<br/>(Auth, Tickets, Analytics, Users)"]
        Envelope["Consistent Envelope<br/>{ success, message, data, pagination }"]
    end

    subgraph Database ["Persistence Layer"]
        Mongoose["Mongoose ODM Models<br/>(User, Ticket, Sprint)"]
        CompoundIdx["Compound Indexes<br/>{ status: 1, priority: 1, createdAt: -1 }"]
        MongoAtlas["MongoDB Atlas / Local MongoDB<br/>(Fallback: Embedded In-Memory Engine)"]
    end

    Pages --> RTK
    RTK --> Proxy
    Proxy -->|Bearer Token & HTTP-only Cookies| MW
    MW --> Zod
    Zod --> Controllers
    Controllers --> Envelope
    Controllers --> Mongoose
    Mongoose --> CompoundIdx
    CompoundIdx --> MongoAtlas
```

---

## ✨ Features Checklist

### 🎨 Week 3 — Frontend (Next.js 15 & shadcn/ui)
- [x] **Next.js App Router**: File-based routing with nested layouts, SEO metadata, streaming, and error boundaries.
- [x] **shadcn/ui & Tailwind CSS**: Component primitives (`Button`, `Input`, `Dialog`, `Table`, `Toast`, `DropdownMenu`, `Tabs`, `Card`, `Badge`, `Skeleton`) with accessible Radix UI foundations.
- [x] **Theming & Dark Mode**: Seamless toggle between classic Atlassian Blue and sleek Dark mode via CSS variables (`next-themes`).
- [x] **Redux Toolkit State Management**: Hydration-safe client provider (`StoreProvider`) holding optimistic Kanban state, active filters, and session auth.
- [x] **Core Product Views**:
  - **Kanban Board** (`/board`): Drag & drop column transitions (`TO DO`, `IN PROGRESS`, `IN REVIEW`, `DONE`), quick issue creator, workspace progress.
  - **All Issues Table** (`/list`): Multi-column sorting (`Key`, `Title`, `Priority`, `Status`, `Story Points`), keyword search, and pagination.
  - **Dynamic Issue Detail** (`/tickets/[id]`): Rich text WYSIWYG editor, discussion comments stream, assignee/reporter selectors, and status switcher.
  - **Workspace Dashboard** (`/dashboard`): Issue completion, WIP, story-point metrics, and team workload from API data, with an empty state for new workspaces.
  - **Authentication Screens** (`/login`, `/register`): Email and password authentication with clear error feedback.

### 🛡️ Week 4 — Backend (Express & MongoDB)
- [x] **Express REST Architecture**: Decoupled routes, controllers, services, centralized error handling with `asyncHandler`, and standard response envelopes.
- [x] **MongoDB & Mongoose**: `User`, `Ticket`, and `Sprint` models with compound indexes, bcrypt password hashing, and user population references.
- [x] **Edge Validation with Zod**: Every write (`POST`, `PUT`, `PATCH`) and query parameter is strictly validated before hitting controller logic.
- [x] **Auth & OWASP Security**:
  - `bcryptjs` salt rounds = 12
  - Short-lived JWT Access Tokens (15m) + Rotating Refresh Tokens (7d)
  - HTTP-only cookies and `Authorization: Bearer <token>` support
  - Role-Based Access Control (`requireRole`)
  - `helmet`, `express-rate-limit`, NoSQL operator injection sanitization, and CORS with credentials
- [x] **Resilient MongoDB Engine**: Connects immediately to your MongoDB Atlas connection string, or transparently falls back to an embedded in-memory MongoDB instance for zero-config testing.
- [x] **Automated Integration Tests**: Vitest + Supertest suite testing the auth lifecycle and ticket CRUD operations.
- [x] **DevOps & CI/CD**: Production `Dockerfile`, `docker-compose.yml`, and GitHub Actions workflow (`.github/workflows/ci.yml`).

---

## ⚡ Quickstart

### 1. Install Dependencies
```bash
# Install root (Next.js) dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure MongoDB URL
Open the repository-root `.env` (or copy from `.env.example`):
```env
MONGODB_URI=your-mongodb-atlas-url-or-local-url
PORT=5000
JWT_SECRET=your-secure-jwt-secret-string
JWT_REFRESH_SECRET=your-secure-refresh-jwt-secret
```
Both secrets are required and must be different; access tokens expire after 15 minutes and refresh tokens after 7 days. The refresh token is only stored in an HTTP-only cookie.
The API always loads the repository-root `.env` first, regardless of its working directory. `server/.env` is only used as a fallback if the root file is absent.
> **Note**: When MongoDB is unavailable, development can use an in-memory database. Its records are temporary and are lost when the API process stops. Configure a persistent `MONGODB_URI` for data you need to retain.

### 3. Run the Full-Stack Application
Start both the Next.js frontend (`:3000`) and the Express REST API (`:5000`) with one command:
```bash
npm run dev
```

Visit:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

Create an administrator account at `/register`. New workspaces start empty and persist only API/database records.
Ticket and analytics requests are scoped by the currently selected workspace. The client sends its ID in the `X-Workspace-Id` header; the API verifies membership before serving workspace data. Use the workspace selector in the sidebar to switch between memberships.

### Migrate existing tickets to workspace isolation
Review the read-only report before applying the one-time backfill. Tickets are assigned only when their reporter belongs to exactly one workspace; ambiguous or unowned tickets and legacy sprints are reported for manual mapping and are never deleted.
```bash
node server/scripts/migrate-ticket-workspaces.js
node server/scripts/migrate-ticket-workspaces.js --apply --confirm
```
The migration refuses to run when `NODE_ENV=production`. Back up the database before applying it; the report lists ticket IDs and reasons that need manual resolution.

### Reset a development database
This destructive command drops every collection in the configured MongoDB database. It refuses to run in production and requires explicit confirmation:
```bash
npm run reset-db -- --confirm
```

---

## 🧪 Running Automated Tests

Run the complete backend integration test suite with Vitest and Supertest:
```bash
npm test
```
Tests cover:
- User registration and bcrypt password hashing
- Duplicate email prevention (409)
- Authentication and token issuance
- Invalid credential rejection (401)
- Ticket sequential key generation
- Zod edge validation on ticket writes (400 Bad Request)
- Ticket pagination and filtering
- Drag-and-drop status transitions
- Discussion comments threading
- Ticket deletion

---

## 🐳 Docker Deployment

Run MongoDB and the Express API in isolated Docker containers:
```bash
docker compose up --build
```

---

## 🧠 Architectural Trade-Offs & Decisions

### 1. Separate Express API vs. Next.js Full-Stack (Route Handlers)
* **Decision**: We decoupled the core business logic into a dedicated Express REST API while keeping lightweight Route Handlers in Next.js for fallback resilience.
* **Why**:
  - **Independent Scaling & Deployment**: A high-velocity engineering organization often needs the API to scale independently on microservices (Render/Railway/ECS/Kubernetes) while the Next.js frontend is distributed via global Edge CDNs (Vercel/Cloudflare).
  - **Multi-Client Support**: An Express REST API can effortlessly serve web, React Native mobile apps, desktop apps, and webhook integrations with uniform JWT authentication and middleware chains (rate limiting, NoSQL sanitization).
  - **Simpler Long-Running Tasks**: Background jobs, webhook listeners, and WebSocket streaming are simpler to manage in an Express server process than in ephemeral serverless functions.

### 2. Redux Toolkit vs. TanStack Query
* **Decision**: Redux Toolkit for complex client state and optimistic UI updates; TanStack Query for server state caching.
* **Why**:
  - **Complex Client Interactivity**: Kanban boards require heavy cross-component client state—active filters (priority, assignee, search), column drag & drop, modal drawers, and optimistic status updates. Redux Toolkit manages this deterministic state with zero hydration mismatches via `StoreProvider`.
  - **Server vs. Client State Rule**: Data belonging to the database (tickets, users) is server state fetched via async thunks; transient UI state (active tab, search filter, sidebar collapsed, modal open) is pure client state in `uiSlice`.

### 3. shadcn/ui vs. Ant Design
* **Decision**: We chose **shadcn/ui** (Tailwind CSS + Radix UI) over Ant Design.
* **Why**:
  - **Code Ownership (Copy-In Model)**: With shadcn/ui, the component code lives directly in `src/components/ui/`. There is no monolithic 5MB NPM package or black-box CSS overrides.
  - **Design Freedom & Performance**: Ant Design imposes rigid opinionated styling and heavy CSS-in-JS runtimes that degrade Next.js SSR performance. shadcn/ui uses CSS variables (`hsl(var(--background))`) and headless Radix UI primitives, resulting in superior Lighthouse performance, seamless dark mode, and complete keyboard accessibility (WCAG compliant).
