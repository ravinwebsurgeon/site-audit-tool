# Project: Site Audit Tool (SaaS)

## Overview
You are working on a full-stack SaaS web application called **Site Audit Tool**.

The application allows users to submit a public website URL and receive a **comprehensive audit report** covering:
- SEO
- Performance
- Security
- Accessibility
- Content quality

The system uses **Claude AI** to generate **prioritized, actionable recommendations** based on audit data.

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui

### Backend
- Next.js API Routes (REST APIs)
- Node.js (server environment)

### Database
- PostgreSQL 16
- Prisma ORM

### Authentication
- NextAuth.js (OAuth + Magic Link)

### AI Integration
- Anthropic Claude API

### Background Jobs
- BullMQ + Redis (for async audit processing)

### Storage
- AWS S3 / Cloudflare R2 (PDF + snapshots)

### Monitoring
- Sentry (errors)
- PostHog (analytics)

---

## Core Features (MVP)

1. URL submission with validation
2. Async audit processing using queue
3. Real-time progress tracking (SSE/WebSocket)
4. Audit report dashboard
5. Issue classification:
   - Critical
   - Warning
   - Passed
6. Claude AI-generated recommendations
7. Audit history (last 50 reports per user)
8. PDF export of reports

---

## Audit Modules (Phase 1)

### SEO
- Title, meta description
- Headings (H1–H6)
- Open Graph tags
- robots.txt, sitemap
- Canonical tags

### Performance
- Core Web Vitals
- Page size & load time
- Render-blocking resources

### Security
- HTTPS enforcement
- SSL certificate validation
- Security headers
- Mixed content detection

---

## Database Design

### Tables

#### users
- id (UUID)
- OAuth data
- subscription tier

#### audit_reports
- id
- user_id
- url
- overall_score
- status

#### audit_sections
- report_id
- category (SEO, Performance, etc.)
- score (JSONB)

#### audit_issues
- report_id
- severity
- description
- recommendation
- status (pass/fail)

#### audit_queue
- job tracking for async processing

#### subscriptions
- billing + plan info

---

## API Endpoints

POST   /api/audits           → Create audit job  
GET    /api/audits/:id       → Get audit report  
GET    /api/audits           → List user audits  
GET    /api/audits/:id/export → Export PDF  
DELETE /api/audits/:id       → Delete report  
POST   /api/schedules        → Create recurring audit  

---

## System Architecture Flow

1. User submits URL
2. API validates + queues job (BullMQ)
3. Worker processes:
   - HTML parsing
   - PageSpeed API
   - Security checks
4. Data sent to Claude API
5. Claude returns recommendations
6. Results stored in PostgreSQL
7. Frontend updates via SSE
8. Report displayed

---

## Key Constraints & Rules

- Always validate and sanitize URLs
- Prevent duplicate audits using URL hashing
- Use async queue for all heavy operations
- Store large data (HTML, PDFs) in S3, not DB
- Use JSONB for flexible audit data
- Ensure scalable architecture (SaaS-ready)

---

## Performance Goals

- Audit completion < 15 seconds
- Handle 100 concurrent audits
- DB query time < 50ms
- 99.5% uptime

---

## Future Phases (Important for Planning)

### Phase 2
- Accessibility checks
- Content analysis
- PDF export improvements
- Scheduled audits
- Notifications (email/Slack)

### Phase 3
- Bulk audits
- Team workspaces (RBAC)
- Public API access
- White-label solution

---

## Risks & Handling

- CORS issues → use server-side fetch
- API rate limits → queue + caching
- AI latency → stream responses
- DB scaling → indexing + partitioning

---

## Instructions for Claude Code

- Generate clean, modular, production-ready code
- Follow best practices for Next.js + Prisma
- Prefer reusable components and services
- Use TypeScript everywhere
- Validate inputs using Zod
- Structure backend with clear separation:
  - routes
  - services
  - db layer
  - queue workers

- When implementing features:
  - Start with MVP-first approach
  - Keep scalability in mind
  - Avoid overengineering

- Always explain architecture decisions when asked

---

## Goal

Build a **scalable, production-ready SaaS audit platform** with:
- Fast performance
- Clean UI/UX
- Reliable async processing
- High-quality AI insights


## Project Structure

Follow this folder structure:

/app                → Next.js app router pages
/components         → Reusable UI components
/lib                → Utilities (helpers, constants)
/services           → Business logic (audit, AI, etc.)
/db                 → Prisma schema & queries
/queue              → BullMQ workers & jobs
/api                → API route handlers
/types              → Global TypeScript types
/validators         → Zod schemas


## Coding Standards

- Use TypeScript strictly (no `any`)
- Use async/await (no callbacks)
- Use Zod for all API validation
- Use Prisma for DB queries (no raw SQL unless necessary)
- Keep functions small and modular
- Use service layer (no business logic in API routes)


## AI Integration Rules

- Send structured audit data to Claude API
- Request:
  - prioritized recommendations
  - actionable fixes
  - severity classification
- Keep responses concise and structured (JSON preferred)
- Do not hallucinate missing audit data

## Data Contracts

AuditReport:
- id
- url
- status
- overallScore
- createdAt

AuditIssue:
- severity: "critical" | "warning" | "passed"
- title
- description
- recommendation

## Performance Rules

- Cache repeated audits for same URL (24h)
- Avoid duplicate processing
- Use indexing in PostgreSQL
- Lazy load heavy UI components

## Error Handling

- Always return structured error responses:
  {
    success: false,
    message: string,
    error?: any
  }

- Log errors using Sentry
- Never expose sensitive data