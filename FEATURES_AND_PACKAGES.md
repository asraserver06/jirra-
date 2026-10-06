# TaskFlow — System Architecture, Features & Packages Documentation

---

## 1. Overview & Architecture
**TaskFlow** is a modern, full-stack Agile Project Management & Issue Tracking application designed with a clean, minimal, and responsive user interface. It combines a Next.js App Router frontend with an Express REST API backend connected to MongoDB Atlas.

```
┌─────────────────────────────────────────────────────────────┐
│                      TaskFlow Frontend                      │
│   Next.js (App Router) + React 19 + Redux Toolkit + shadcn  │
│                   Port: 3000 (Turbopack)                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / OAuth
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      TaskFlow Backend                       │
│    Express.js + TypeScript + Mongoose + Zod + JWT / OAuth   │
│                         Port: 5000                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas Cloud                      │
│            Collections: Users, Tickets, Sprints             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Features

### 🔐 Authentication & User Management
- **Google OAuth 2.0 Integration**: One-click Google Sign-In & Sign-Up via Google Identity Services (`@react-oauth/google` and `google-auth-library` server-side token validation).
- **Email & Password Authentication**: Secure registration and login with `bcryptjs` password hashing (salt rounds: 12).
- **JWT Session Handling**: Stateless authentication using short-lived Access Tokens (15m) and secure, HTTP-only Refresh Tokens (7d).
- **Demo Quick-Login**: 1-click login buttons for testing different team roles (Admin, Lead).
- **Role-Based Access Control (RBAC)**: Support for `admin`, `lead`, `developer`, and `viewer` roles.

### 📋 Interactive Kanban Board & Workflow Engine
- **Multi-Column Workflow**: Drag/move tickets across four distinct lifecycle stages:
  - `TO DO` (Backlog / ready for pickup)
  - `IN PROGRESS` (Actively being developed)
  - `IN REVIEW` (Code review & QA)
  - `DONE` (Completed)
- **Optimistic State Updates**: Immediate Redux UI updates for smooth card movements with synchronized backend persistence.
- **Framer Motion Animations**: Smooth layout animations, hover states, card reordering, and modal transitions.

### 🔍 Advanced Filtering, Search & Progress Tracking
- **Multi-Factor Search**: Instant client-side filtering by ticket title, key (`PROJ-101`), or description.
- **Priority Filtering**: Filter by `All`, `High & Urgent`, `Medium`, or `Low`.
- **Assignee Avatar Filtering**: Filter tickets by assigned team member avatars.
- **Real-Time Sprint Progress Bar**: Interactive segmented progress widget showing completion percentages and story point tallies (`Completed tasks %` & `Points burned`).

### 📝 Issue Creation & Rich Text Editing
- **Ticket Modal Management**: Create, edit, and view issue details with status, priority, story points, and assignee selection.
- **Rich Text Formatter**: Formatted ticket descriptions with custom font styles and alignment controls.

### 🎨 Modern UI / UX & Theming
- **shadcn/ui Design System**: Built on Radix UI primitives and styled with Tailwind CSS.
- **Dark & Light Mode**: Seamless theme switching with `next-themes` and persistent user preference.
- **Responsive Layout**: Collapsible sidebar, sticky glassmorphic navigation header, and fluid mobile-friendly grid.

---

## 3. Package Dependencies

### 🌐 Frontend Packages (`package.json`)

| Package | Version | Purpose / Use Case |
| :--- | :--- | :--- |
| `next` | `^16.3.8` | Next.js App Router framework with Turbopack bundler |
| `react` / `react-dom` | `^19.0.0` | React core library |
| `@reduxjs/toolkit` | `^2.13.0` | Centralized global state management (auth, tickets, ui slices) |
| `react-redux` | `^9.3.0` | React bindings for Redux Toolkit |
| `@react-oauth/google` | `^0.13.5` | Google Identity Services OAuth button & provider |
| `framer-motion` | `^14.0.0` | Smooth UI animations, gestures, and layout transitions |
| `lucide-react` | `^0.475.0` | Modern, clean vector icon suite |
| `next-themes` | `^0.4.6` | Dark/Light mode theme provider with system sync |
| `@radix-ui/react-dialog` | `^1.1.23` | Accessible modal dialog primitives |
| `@radix-ui/react-dropdown-menu` | `^2.1.24` | Accessible context & dropdown menus |
| `@radix-ui/react-select` | `^2.3.7` | Accessible custom select inputs |
| `@radix-ui/react-tabs` | `^1.1.21` | Accessible tab navigation components |
| `@radix-ui/react-tooltip` | `^1.2.16` | Hover tooltips for cards and controls |
| `@radix-ui/react-slot` | `^1.3.3` | Polymorphic component composition for shadcn |
| `class-variance-authority` | `^0.7.1` | Type-safe variant creation for UI components |
| `clsx` / `tailwind-merge` | `^2.1.1` / `^3.7.0` | Dynamic and conflict-free Tailwind class combination |
| `concurrently` | `^10.0.5` | Runs frontend and backend servers simultaneously with `npm run dev` |
| `tailwindcss` | `^3.4.17` | Utility-first CSS styling engine |
| `typescript` | `^5.7.2` | Static type checking and IntelliSense |

---

### ⚙️ Backend Packages (`server/package.json`)

| Package | Version | Purpose / Use Case |
| :--- | :--- | :--- |
| `express` | `^4.21.2` | High-performance Node.js HTTP server framework |
| `mongoose` | `^8.9.5` | MongoDB Object Data Modeling (ODM) for Schemas & Queries |
| `google-auth-library` | `^11.1.0` | Official Google OAuth2 token verification on the backend |
| `jsonwebtoken` | `^9.0.2` | Generation and verification of JWT access and refresh tokens |
| `bcryptjs` | `^2.4.3` | Salted password hashing and validation |
| `zod` | `^3.24.1` | Schema declaration and strict API request validation |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing configuration |
| `helmet` | `^8.0.0` | HTTP response headers security middleware |
| `cookie-parser` | `^1.4.7` | Parses cookies for secure refresh token handling |
| `express-rate-limit` | `^7.5.0` | API rate limiting protection |
| `dotenv` | `^16.4.7` | Loads environment variables from `.env` files |
| `tsx` | `^4.19.2` | Fast TypeScript execution and watch mode during development |
| `vitest` / `supertest` | `^3.0.4` / `^7.0.0` | Unit & API integration testing suite |
| `mongodb-memory-server` | `^10.1.3` | In-memory MongoDB instance for isolated testing |

---

## 4. Summary of API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in with email & password | No |
| `POST` | `/api/auth/google` | Google OAuth token verification & session creation | No |
| `POST` | `/api/auth/refresh` | Refresh expired access token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (JWT) |
| `GET` | `/api/auth/users` | List team members for assignee assignment | No |
| `GET` | `/api/tickets` | Query and filter board tickets | Yes (JWT) |
| `POST` | `/api/tickets` | Create a new ticket / task | Yes (JWT) |
| `GET` | `/api/tickets/:id` | Fetch ticket details by ID | Yes (JWT) |
| `PATCH` | `/api/tickets/:id` | Update ticket details | Yes (JWT) |
| `PATCH` | `/api/tickets/:id/status` | Move ticket status (drag & drop) | Yes (JWT) |
| `DELETE` | `/api/tickets/:id` | Remove a ticket | Yes (JWT) |
| `POST` | `/api/tickets/:id/comments` | Add comment to an issue | Yes (JWT) |
| `GET` | `/api/analytics/sprint-metrics` | Compute sprint metrics and burndown | Yes (JWT) |
