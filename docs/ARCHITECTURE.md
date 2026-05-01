# Architecture

## Overview

Grow Logs is a monolithic web application with a clear separation between frontend and backend. It is designed for a single developer to build, deploy, and maintain, while following industry standard practices that scale naturally as the product grows.

The system consists of four primary components:

- A Next.js frontend application served via Vercel
- A NestJS REST API backend hosted on AWS ECS
- A PostgreSQL database hosted on AWS RDS
- AWS SES for transactional email delivery

---

## High Level Diagram

```
User (Browser)
      |
      | HTTPS
      v
[Next.js Frontend - Vercel]
      |
      | HTTPS REST API calls
      v
[NestJS Backend - AWS ECS]
      |
      |--- PostgreSQL (AWS RDS)
      |--- AWS SES (Email)
```

The frontend never talks directly to the database. All data access goes through the backend API. The backend is the single source of truth for all business logic and data validation.

---

## Frontend Architecture

The Next.js frontend is responsible for rendering the user interface and managing user interactions. It communicates with the backend exclusively through REST API calls.

**Responsibilities:**

- Rendering all pages and UI components
- Managing client side state (Zustand)
- Caching and synchronising server state (React Query)
- Form validation before submission (React Hook Form + Zod)
- Storing the JWT access token securely (HTTP-only cookie)
- Redirecting unauthenticated users to the login page

**What it does not do:**

- Direct database access
- Business logic
- Sending emails
- Any sensitive operations

**Internal structure:**

```
Next.js App (App Router)
      |
      |-- Pages / Routes
      |       |-- Public routes (landing, login, register)
      |       |-- Protected routes (dashboard, settings, onboarding)
      |
      |-- Components (shadcn/ui based)
      |
      |-- React Query (server state - API data)
      |
      |-- Zustand Store (client state - UI state)
      |
      |-- Zod Schemas (imported from packages/schemas)
      |
      |-- API Client (axios or fetch wrapper with JWT injection)
```

The API client is a thin wrapper that automatically attaches the JWT token to every outgoing request and handles 401 responses by redirecting to login.

---

## Backend Architecture

The NestJS backend handles all business logic, data validation, authentication, and database operations. It is organised into feature modules, each responsible for one domain area.

**Module structure:**

```
NestJS Application
      |
      |-- AuthModule
      |     Register, login, email verification, JWT strategy, password change
      |
      |-- UsersModule
      |     User profile and account management
      |
      |-- CategoriesModule
      |     Main categories and subcategories CRUD
      |
      |-- EntriesModule
      |     Log entry CRUD and summary analytics
      |
      |-- OnboardingModule
      |     Onboarding completion logic
      |
      |-- EmailModule
      |     AWS SES integration and email templates
      |
      |-- FeatureFlagsModule
      |     Feature flag checks with 60 second in-memory caching
      |
      |-- AdminModule
      |     Admin-only user management and flag toggling
      |
      |-- CommonModule
            Shared guards, pipes, interceptors, decorators, response transformer
```

Each module follows the same internal pattern:

```
Module
  |-- Controller   (handles HTTP requests and routing)
  |-- Service      (business logic)
  |-- DTOs         (request and response shapes with Zod validation)
  |-- Entities     (TypeScript types matching database models)
```

---

## Authentication Flow

**Registration:**

```
Client                    Backend                   Database
  |                          |                          |
  |-- POST /auth/register --> |                          |
  |                          |-- Validate (Zod)         |
  |                          |-- Hash password (bcrypt) |
  |                          |-- Create user ---------> |
  |                          |-- Send verification email|
  |<-- 201 Created --------- |                          |
```

**Login:**

```
Client                    Backend                   Database
  |                          |                          |
  |-- POST /auth/login -----> |                          |
  |                          |-- Validate credentials   |
  |                          |-- Fetch user ----------> |
  |                          |<-- User record --------- |
  |                          |-- Compare hash (bcrypt)  |
  |                          |-- Generate JWT           |
  |<-- 200 OK + JWT token --- |                          |
```

**Authenticated request:**

```
Client                    Backend
  |                          |
  |-- GET /entries           |
  |   Authorization:         |
  |   Bearer <token> ------> |
  |                          |-- JWT Guard validates token
  |                          |-- Extract user ID from token
  |                          |-- Execute with user context
  |<-- 200 OK + data ------- |
```

---

## Request Lifecycle

Every request passes through this chain in order. If any step fails, the chain stops and an error response is returned.

```
Incoming HTTP Request
        |
        v
   Middleware
   (logging, CORS)
        |
        v
    Guards
   (JWT authentication check, RolesGuard for admin routes)
        |
        v
   Interceptors
   (request logging, response transformation to standard envelope)
        |
        v
    Pipes
   (Zod validation of request body and query parameters)
        |
        v
  Controller
  (route handler, delegates to service)
        |
        v
   Service
   (business logic, ownership checks)
        |
        v
  Prisma Client
  (database queries)
        |
        v
  PostgreSQL
        |
        v
  Response travels back up the chain
```

---

## Data Flow: Creating a Log Entry

A concrete end-to-end example of the most common operation in the application.

```
User types entry in form
        |
        v
React Hook Form captures input
        |
        v
Zod validates on client side (catches errors before API call)
        |
        v
React Query mutation fires POST /entries with JWT token
        |
        v
NestJS JWT Guard validates token
        |
        v
Zod pipe validates request body (server side, independent of client)
        |
        v
EntriesController receives request
        |
        v
EntriesService executes business logic
(verifies category belongs to authenticated user)
        |
        v
Prisma creates entry in PostgreSQL
        |
        v
Created entry returned up the chain
        |
        v
Response interceptor wraps in standard envelope
        |
        v
201 response returned to frontend
        |
        v
React Query invalidates entries cache
        |
        v
Dashboard re-fetches and displays new entry
```

---

## Error Handling Strategy

**Backend:**

A global exception filter catches all unhandled errors and returns consistent JSON error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["text must be at least 10 characters"],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/entries"
}
```

Three categories of errors:

- Validation errors (400) — caught by Zod pipes
- Authentication errors (401) — caught by JWT guard
- Business logic errors (404, 409, 422) — thrown explicitly in services
- Unexpected errors (500) — caught by global exception filter, logged, internals never exposed to client

**Frontend:**

React Query handles API error states on every query and mutation. A global toast notification system via shadcn/ui displays user-friendly error messages. Raw API error messages are never shown directly to the user.

---

## Environment Configuration

Three environments:

```
Development  -->  Local machine, local PostgreSQL via Docker
Staging      -->  AWS, mirrors production, used for testing before release
Production   -->  AWS, real users, real data
```

Environment variables are managed via .env files locally and AWS Secrets Manager in staging and production.

NestJS uses @nestjs/config with a Zod validation schema to ensure all required environment variables are present at startup. If any required variable is missing, the application refuses to start.

---

## API Design Principles

- Resources are nouns, not verbs: /entries not /getEntries
- HTTP methods express the action: GET, POST, PATCH, DELETE
- All endpoints versioned under /api/v1
- Consistent response envelope for all endpoints
- Pagination on all list endpoints from day one
- UUIDs validated as proper format before hitting the database
- Every query scoped by authenticated user ID

**Standard success response (single resource):**

```json
{
  "data": {},
  "meta": {}
}
```

**Standard success response (list):**

```json
{
  "data": [],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## Security Baseline

- Passwords hashed with bcrypt, never stored plain text
- JWT tokens expire after 7 days
- All endpoints except register and login require authentication
- Every query scoped by authenticated user ID — users can never access each other's data
- CORS configured to allow requests only from the frontend domain
- Rate limiting on authentication endpoints via NestJS throttler
- Environment variables never committed to the repository
- HTTPS enforced everywhere
- Helmet.js middleware sets secure HTTP headers
- Admin endpoints protected by RolesGuard in addition to JWT guard

---

## API Documentation

Swagger UI is available at /api/docs in development and staging environments. Disabled in production by default, controllable via feature flag.

Every endpoint documents:

- Description of what it does
- Required authentication
- Request body schema
- All possible response codes and shapes
- Example request and response

Generated automatically from NestJS decorators via @nestjs/swagger.
