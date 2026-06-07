# Server Backend Documentation

## Overview
This documentation describes the backend implementation for the `FE` workspace. The backend is implemented as part of the Next.js application and exposed through `app/api/v1`. The server folder contains the internal data access, service integration, feature modules, migrations, and shared utilities.

## Backend Scope
This README covers:
- `app/api/v1`: API route handlers and endpoint definitions
- `server/`: backend implementation and database layer
- `lib/` modules relevant to backend behavior, excluding:
  - `lib/plant`
  - `lib/translation`
  - `lib/map-observations.ts`
  - `lib/utils.ts`

> `lib/plant`, `lib/translation`, `lib/map-observations.ts`, and `lib/utils.ts` are intentionally excluded from this documentation per request.

---

## Architecture

### API Layer (`app/api/v1`)
The API surface is implemented via Next.js route handlers in `app/api/v1`. Each route exports a request handler for standard HTTP methods such as `GET`, `POST`, `PATCH`, and `DELETE`.

The route folder structure is organized by domain:
- `auth/`: authentication, session management, password flow, refresh, logout, and profile
- `plants/`: plant listing, detail, create/update/delete, detect endpoint
- `identifications/`: identification list and detail retrieval
- `locations/`: location list, nearby images, stats, and details
- `roles/`: role retrieval
- `translate/`: translation request handling
- `audit/`: audit log retrieval and event submissions
- `health/`: live health check
- `docs/`: API reference generation endpoint

#### Supported Endpoints
| Path | HTTP Method | Purpose |
|---|---|---|
| `/api/v1/auth` | GET | Fetch login/auth metadata and status |
| `/api/v1/auth/login` | POST | Authenticate user and issue access/refresh cookies |
| `/api/v1/auth/logout` | POST | Clear auth cookies and revoke the session |
| `/api/v1/auth/refresh` | POST | Refresh access and refresh tokens |
| `/api/v1/auth/profile` | GET | Get authenticated user profile |
| `/api/v1/auth/forgot-password` | POST | Begin password reset flow |
| `/api/v1/auth/verify-reset-code` | POST | Verify password reset code |
| `/api/v1/auth/reset-password` | POST | Complete password reset |
| `/api/v1/health` | GET | Health check endpoint |
| `/api/v1/docs` | GET | Generate and serve OpenAPI reference |
| `/api/v1/audit` | GET | Search and paginate audit logs |
| `/api/v1/audit` | POST | Record audit events |
| `/api/v1/plants` | GET | List plants with query filters |
| `/api/v1/plants` | POST | Create a new plant record |
| `/api/v1/plants/[id]` | GET | Get plant detail by ID |
| `/api/v1/plants/[id]` | PATCH | Update plant record by ID |
| `/api/v1/plants/[id]` | DELETE | Delete plant record by ID |
| `/api/v1/plants/detect` | POST | Perform plant detection through external detection API |
| `/api/v1/identifications` | GET | List identification records |
| `/api/v1/identifications/[id]` | GET | Get identification detail by ID |
| `/api/v1/users` | GET | List users with filters |
| `/api/v1/users` | POST | Create a new user |
| `/api/v1/users/[id]` | GET | Get user detail by ID |
| `/api/v1/users/[id]` | PATCH | Update user by ID |
| `/api/v1/users/[id]` | DELETE | Delete user by ID |
| `/api/v1/roles` | GET | List available RBAC roles |
| `/api/v1/locations` | GET | List locations and pagination info |
| `/api/v1/locations/nearby` | GET | Query nearby location images |
| `/api/v1/locations/details` | GET | Get location details by coordinates |
| `/api/v1/locations/stats` | GET | Fetch location summary statistics |
| `/api/v1/translate` | POST | Forward translation requests |

---

## Server Folder Structure

### `server/db`
Contains database initialization and type-safe schema metadata.
- `server/db/index.ts`: selects connection string based on runtime environment and exports `db`
- `server/db/kysely.ts`: creates the Kysely `PostgresDialect` database client
- `server/db/types.ts`: `Database` schema types for `users`, `roles`, `plants`, `identifications`, and `images`

#### Database flow
- Uses `DATABASE_URL` by default
- Uses `TEST_DATABASE_URL` when `NODE_ENV === 'test'`
- The Kysely client is configured with a `pg` connection pool

### `server/features`
Feature modules follow a consistent domain-driven design pattern.
Each feature contains:
- `index.ts`: top-level feature exports
- `module.ts`: feature wiring and module-level exports
- `repo.ts`: repository functions that perform database operations
- `queries/`: reusable query builders for list and lookup operations
- `commands/`: write operations for mutation commands
- `schemas/`: Zod validation schemas for request payloads
- `mappers/`: transform raw database rows into application models

#### Feature domains
- `identification`: identification record retrieval and listing
- `plant`: plant record CRUD operations and detection data mapping
- `role`: list and transform RBAC role records
- `user`: user creation, update, deletion, and lookup operations

### `server/services`
Contains service integrations for external APIs.
- `server/services/auth`: proxies authentication flows to an external auth service via `AUTH_API_URL`
- `server/services/locations`: fetches location data from `UPLOAD_API_URL`
- `server/services/audit`: forwards audit log reads and writes to `AUDIT_API_URL`
- `server/services/upload`: wraps file upload and delete requests against `UPLOAD_API_URL`

The service layer uses typed schemas and wraps remote failures into structured errors.

### `server/shared`
Reusable supporting utilities and schemas.
- `server/shared/helpers/slugify.ts`: slug generation helper
- `server/shared/schemas`: reusable Zod schemas for common request fields
  - `boolean.schema.ts`
  - `coordinate.schema.ts`
  - `id.schema.ts`
  - `image.schema.ts`
  - `query.schema.ts`

### `server/migrations`
- Contains database versioning scripts
- Primary migration: `001_init.ts`
- Creates normalized tables, indexes, and update triggers

### `server/scripts`
- `migrate.ts`: runs Kysely migrations against `server/migrations`
- `seed.ts`: seed script placeholder for production or local bootstrap

---

## Root Library Integration
This backend relies on several shared root library modules.

### `lib/auth.ts`
- Provides `getAuthUser()` to resolve the currently authenticated user from cookies
- Provides `authorize()` to verify role-based access rules

### `lib/next-pagination.ts`
- Builds `prev`/`next` page links for paginated API responses
- Used by APIs that support paged results

### `lib/openapi`
- `lib/openapi/generate.ts`: generates OpenAPI v3 documentation from registered schemas
- `lib/openapi/register-paths.ts`: imports path declarations used by the docs generator

### `lib/validation/parse-with-zod.ts`
- Validates incoming API payloads and query shapes
- Converts Zod validation failures into structured application errors

---

## External Dependencies
The server depends on the following packages for runtime and tooling. These must be available in the root `package.json` of the workspace.

### Core backend dependencies
- `kysely`
- `pg`
- `zod`
- `@asteasolutions/zod-to-openapi`
- `@scalar/nextjs-api-reference`
- `@gradio/client`
- `dotenv` (for local script execution and environment loading)

### Next.js and platform dependencies
- `next`
- `react`, `react-dom`
- `next-themes`
- `@types/node`, `typescript`

> Note: The UI and full app are integrated in the same monorepo. The backend uses the same root package registry.

---

## Environment Variables
The backend depends on the following environment variables.

### Required runtime variables
- `DATABASE_URL`: PostgreSQL connection string used for normal backend runtime
- `TEST_DATABASE_URL`: PostgreSQL connection string used when `NODE_ENV === 'test'`
- `AUTH_API_URL`: Base URL for external authentication service
- `AUDIT_API_URL`: Base URL for external audit service
- `UPLOAD_API_URL`: Base URL for external upload/location service
- `DETECTION_API_URL`: External Gradio detection service URL for `/api/v1/plants/detect`

### Optional runtime variables
- `NODE_ENV`: Controls environment behavior
  - `production`: enables secure cookie flags for `access_token` and `refresh_token`
  - `test`: uses `TEST_DATABASE_URL`

Example variables from `.env.example`:
```ini
DATABASE_URL=postgresql://{username}:{password}@{host}:{port}/{database_name}
DETECTION_API_URL=
AUTH_API_URL=
AUDIT_API_URL=
UPLOAD_API_URL=
```

---

## Database and Migration Notes

### Schema overview
The initial migration creates the following tables and constraints:
- `roles`: RBAC roles with unique names
- `users`: app users with role relationships and password hashes
- `plants`: plant master data with taxonomy, descriptions, and detection flags
- `images`: uploaded image metadata
- `identifications`: AI identification records tied to plants, images, and users
- `audit_logs`: audit history entries for actor/entity/action tracking

### Migration tooling
- Run migrations with: `npm run migrate`
- Migrations use `server/scripts/migrate.ts`
- `server/scripts/migrate.ts` loads `.env` via `dotenv/config` when executed locally

### Seed tooling
- Run seed script with: `npm run seed`
- `server/scripts/seed.ts` can be extended for initial production data

---

## Service Contracts and Flows

### Authentication flow
- `app/api/v1/auth/login`: forwards login credentials to `AUTH_API_URL`
- `app/api/v1/auth/refresh`: refreshes JWT tokens with auth backend
- `app/api/v1/auth/profile`: fetches authenticated profile using access token
- `server/services/auth`: wraps external auth API calls and converts failures to `ApiError`

### Audit flow
- `app/api/v1/audit`: reads audit logs and creates new audit records
- `server/services/audit`: translates request filters into remote audit queries

### Location flow
- `app/api/v1/locations/*`: proxies location and nearby-image queries to `UPLOAD_API_URL`
- `server/services/locations`: converts app query shapes to external location API URLs

### Detection flow
- `app/api/v1/plants/detect`: accepts multipart image uploads and forwards them to the Gradio detection service configured by `DETECTION_API_URL`
- `server/features/plant/mappers/map-detection-response`: maps Gradio prediction output into platform payloads

---

## Feature Development Guidelines

### Adding a new domain feature
Follow the existing conventions:
1. Create a `server/features/<domain>` folder
2. Add `module.ts`, `index.ts`, and domain models
3. Add `schemas/` for request validation
4. Add `queries/` and `repo.ts` for database access
5. Add `mappers/` for API response transformation

### Adding a new API route
1. Add a new route under `app/api/v1/<domain>`
2. Use `withErrorHandling` and `parseWithZod` for consistent validation
3. Use `getAuthUser()` for authenticated routes
4. Keep business logic out of route handlers; delegate to `server/services` or `server/features`

### Error handling
- Use `withErrorHandling` in route handlers to normalize API exceptions
- Use typed `ApiError` payloads from `lib/api/api-error` for structured HTTP errors
- Keep validation failures and remote service failures explicit and actionable

---

## Recommended Maintenance Practices
- Keep route handlers lightweight and delegate validation to Zod schemas
- Keep database access in `server/features/*/repo.ts` and domain queries in `queries/`
- Keep external API configuration in environment variables only
- Keep the migration file as the single source of truth for schema creation
- Document new environment variables and external dependencies immediately

---

## Quick Start
1. Copy `.env.example` to `.env`
2. Fill in the required external service URLs and PostgreSQL connection strings
3. Run `npm install`
4. Run `npm run migrate`
5. Run `npm run seed` if needed
6. Start the app with `npm run dev`

---

## Reference
This backend is designed to work inside the Next.js application at the root of the workspace. All API requests under `/api/v1` use the server code in `server/` and shared helpers from `lib/`.
