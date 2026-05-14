# Decision Log

Every significant technical decision made during the design phase, with reasoning. This exists so that future decisions are made with awareness of past ones, and so the reasoning is never lost.

---

## Email Provider: Resend over AWS SES

**Decision:** Use Resend for transactional email delivery instead of AWS SES.

**Reasoning:** AWS SES was the original choice for cost efficiency at scale. However, SES requires significant setup overhead that is disproportionate for a project at MVP stage: sandbox mode exit approval, IAM role configuration, domain and sender identity verification, and AWS account prerequisites. Resend offers a far simpler integration (single API key, clean SDK), a free tier of 3,000 emails/month that comfortably covers early production usage, and no sandbox restrictions. The architecture is identical either way — `EmailModule` is a thin service with a single `sendVerificationEmail` method, so switching providers later requires changing only that service's internals and swapping one env var for two.

**Migration path if needed:** Replace `resend` package with `@aws-sdk/client-ses`, rewrite `EmailService` send logic, swap `RESEND_API_KEY` for `AWS_REGION` + `AWS_SES_FROM_ADDRESS`. No other files change.

---

## Token Strategy: Short-Lived JWT + Opaque Refresh Token with Rotation

**Decision:** Use a two-token authentication scheme: a short-lived JWT access token (1 hour) paired with an opaque refresh token (7-day rolling window, stored hashed in the database). Each time the access token is refreshed, the old refresh token is invalidated and a new one is issued. If a refresh token that has already been rotated is presented again, all sessions for that user are immediately wiped.

**Reasoning:** The original design used a single 7-day JWT. This has two weaknesses: a stolen token is valid for 7 days with no way to revoke it, and logout has no server-side effect. The two-token approach fixes both. The 1-hour access token limits the damage window of a stolen token without requiring frequent re-login, because the refresh token handles silent renewal in the background. Storing the refresh token as a hash in the database means logout is real — deleting the row makes the token dead immediately. Rotation adds theft detection: if an attacker steals a refresh token and uses it, the legitimate user's next refresh will fail (the token was already rotated), triggering a full session wipe.

Absolute expiry (a hard ceiling regardless of activity) was considered and deliberately excluded. The target users are developers logging daily work; an involuntary re-login every N days has no security benefit that justifies the UX cost for this application. The rolling 7-day window already ensures inactive users are eventually logged out.

**Implementation impact:**
- A `refresh_tokens` table stores one row per active session (token_hash, user_id, expires_at)
- Login response sets the refresh token as an HTTP-only cookie; access token is returned in the response body
- `POST /auth/refresh` validates the cookie, rotates the token, returns a new access token
- `POST /auth/logout` deletes the refresh token row — token is dead immediately on the server
- Reuse detection: if token_hash not found (already rotated), delete all refresh_tokens rows for that user_id

---

## Authentication: Custom JWT over Clerk

**Decision:** Implement authentication manually using Passport.js and JWT rather than using a hosted auth service like Clerk.

**Reasoning:** The primary goal of this project is to learn industry standard practices deeply. Clerk abstracts away exactly the patterns (JWT signing, token validation, Passport strategies, bcrypt hashing) that are most valuable to understand and most commonly asked about in engineering interviews. Clerk is a valid tool for time-constrained commercial projects and is worth knowing about, but for this project the learning value of building it manually outweighs the time saved.

---

## ORM: Prisma over TypeORM

**Decision:** Use Prisma as the ORM for database access.

**Reasoning:** Prisma provides better TypeScript integration, a cleaner and more readable schema definition format, a more intuitive migration system, and overall better developer experience for a solo project. TypeORM is a valid alternative and common in NestJS projects, but Prisma is the more modern choice and increasingly the industry standard in the Node.js and TypeScript ecosystem.

---

## Database: PostgreSQL

**Decision:** Use PostgreSQL as the relational database.

**Reasoning:** The data model is inherently relational. Users own categories, categories own subcategories, and entries reference both. These relationships are clearly expressed with foreign keys and JOIN queries. A document database like MongoDB would add unnecessary complexity for this structure. PostgreSQL is battle tested, widely deployed in production, fully supported by Prisma, and hosted cleanly on AWS RDS.

---

## Monorepo: Turborepo

**Decision:** Use Turborepo to manage the monorepo with npm workspaces.

**Reasoning:** A monorepo allows the frontend and backend to share TypeScript types and Zod validation schemas from a single source of truth in the packages directory. This eliminates duplication and ensures frontend and backend stay in sync on data shapes. Turborepo was chosen over Nx because it is significantly simpler to configure for a project of this size while still providing the essential monorepo features such as parallel task execution and build caching.

---

## Validation: Shared Zod Schemas

**Decision:** Define Zod schemas once in packages/schemas and import them in both the NestJS backend and the Next.js frontend.

**Reasoning:** Validation logic should have one source of truth. Defining it twice — once for frontend form validation and once for backend request validation — creates a maintenance burden and risks the two falling out of sync. Sharing schemas via the packages directory means a change to a validation rule is reflected everywhere automatically.

---

## Entry Text: Markdown over Plain Text or Rich Text

**Decision:** Store entry text as plain markdown in a PostgreSQL TEXT column. Render markdown on the frontend using a markdown parser.

**Reasoning:** Plain text only would be too limiting for users who want to add structure to their entries such as bullet points, code blocks, and links. A full rich text editor with JSON or HTML storage would add significant complexity to both the frontend component and the storage layer. Markdown is the right middle ground: it gives formatting capability with zero schema complexity, is familiar to the developer-focused target users, and is stored as a simple string.

---

## Category Limits: Application Level Enforcement

**Decision:** Enforce the 5 category maximum per user in the CategoriesService, not as a database constraint.

**Reasoning:** Business rules that are likely to change (such as paid users getting unlimited categories) belong in application code, not database constraints. A database constraint would require a migration every time the rule changes. A service-level check requires changing one line of code and can easily be made tier-aware when Stripe billing is added.

---

## Roles and Subscription Status: Separate Concerns

**Decision:** Store user role (USER, ADMIN) and subscription status (FREE, ACTIVE, CANCELLED, PAST_DUE) as separate fields on the users table rather than combining them into one field.

**Reasoning:** Role and subscription status are fundamentally different concepts. A user can be an ADMIN on a FREE plan or a USER on an ACTIVE paid plan. Combining them into a single enum creates an explosion of combinations as tiers grow and makes the logic significantly harder to reason about. Keeping them separate means each can evolve independently.

---

## Subcategory user_id Denormalisation

**Decision:** Store user_id directly on the subcategories table even though it is reachable through the category_id foreign key.

**Reasoning:** Ownership verification is required on every mutating request involving a subcategory. Without the denormalised user_id, this check requires a JOIN from subcategories to categories to users. Storing user_id directly on subcategories reduces this to a single equality check. This is a deliberate and minor denormalisation justified by the frequency of the operation.

---

## Delete Behaviours: Explicit per Relationship

**Decision:** Define ON DELETE behaviour explicitly for every foreign key rather than using a single default.

- users → categories: CASCADE (user deleted, categories deleted)
- users → subcategories: CASCADE
- users → entries: CASCADE
- categories → subcategories: CASCADE (category deleted, subcategories deleted)
- categories → entries: RESTRICT (cannot delete category with entries attached)
- subcategories → entries: SET NULL (subcategory deleted, entries retain category)

**Reasoning:** Each relationship has different data integrity requirements. Entries are the most valuable data and should never be silently deleted. The RESTRICT on category deletion forces the application to handle this case explicitly, prompting the user before proceeding. SET NULL on subcategory deletion is a softer behaviour appropriate for an optional reference.

---

## Hard Deletes at MVP

**Decision:** Use hard deletes at MVP stage. Soft delete to be added later via migration.

**Reasoning:** Soft delete adds complexity to every query in the codebase (every query must filter WHERE deleted_at IS NULL). At MVP stage this complexity is not justified. When soft delete is added later, it will require a migration to add the deleted_at column and an audit of all service-layer queries, which is a manageable and deliberate refactor.

---

## Feature Flags: Custom Database Implementation

**Decision:** Implement feature flags as a database table with a simple FeatureFlagsService rather than using a hosted service like Unleash.

**Reasoning:** For MVP, a hosted feature flag service adds infrastructure cost and complexity that is not justified. A database table with a key-value structure and a 60 second in-memory cache achieves the same result with zero additional infrastructure. This also teaches the underlying pattern clearly. Migrating to a proper feature flag service like Unleash is straightforward later if needed.

---

## API Versioning: URL Prefix from Day One

**Decision:** Prefix all endpoints with /api/v1 from the first line of code.

**Reasoning:** Adding versioning after launch is painful and requires coordinating changes with existing API consumers. Adding it from day one costs nothing and means breaking changes can be introduced under /v2 while /v1 remains available for a deprecation period. This is standard practice for any API expected to evolve.

---

## Frontend Hosting: Vercel over AWS Amplify

**Decision:** Host the Next.js frontend on Vercel rather than AWS Amplify.

**Reasoning:** Vercel is built and maintained by the same team that builds Next.js. It has first-class support for all Next.js features including App Router, server components, and edge functions. AWS Amplify support for Next.js has historically lagged behind. For a solo developer, Vercel is significantly simpler to configure and deploy to while remaining the industry standard choice for Next.js applications.