# Dojo API

Standalone REST API application with OAuth2 authentication and JWT tokens. Built with Next.js 16 (API routes only), Prisma 7, and MariaDB/MySQL.

## Features

- **OAuth2 Provider** — Password grant, client credentials, refresh token rotation
- **JWT Access Tokens** — HS256 signed, 15-minute expiry
- **Refresh Tokens** — UUID-based, 30-day expiry, single-use rotation
- **Course Management** — Full CRUD with chapters, attachments, publish toggle
- **Promo Codes** — Create, validate, apply with per-user usage tracking
- **Purchases** — Mock payment with optional promo code discounts
- **Progress Tracking** — Per-chapter completion status
- **Blog Posts** — CRUD with tag associations
- **YouTube Videos** — Video management with ordering
- **File Upload** — Admin-only, 50MB max, whitelist file types
- **Swagger Docs** — Interactive API documentation at `/api/docs`

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL or MariaDB database

### Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

| Variable       | Description                           | Example                                         |
| -------------- | ------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL` | MySQL connection string               | `mysql://root:password@localhost:3306/dojo_api` |
| `JWT_SECRET`   | Secret for JWT signing (min 32 chars) | `your-random-secret-string-here-32chars`        |
| `UPLOAD_DIR`   | Directory for uploaded files          | `/tmp/dojo-api-uploads`                         |

## API Documentation

Visit **http://localhost:3000/api/docs** for interactive Swagger UI.

Import the OpenAPI spec into Postman: `GET http://localhost:3000/api/docs/spec`

## Authentication Flow

### 1. Register a user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "Password1"}'
```

### 2. Get access token (password grant)

```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type": "password", "email": "john@example.com", "password": "Password1"}'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "scope": "read write"
}
```

### 3. Use the access token

```bash
curl http://localhost:3000/api/oauth/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### 4. Refresh the token

```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type": "refresh_token", "refresh_token": "550e8400-e29b-41d4-a716-446655440000"}'
```

### 5. Client credentials (M2M)

```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type": "client_credentials", "client_id": "client_test_app", "client_secret": "test-secret-do-not-use-in-production"}'
```

## Seeded Test Accounts

| Role  | Email            | Password    |
| ----- | ---------------- | ----------- |
| Admin | `admin@dojo.api` | `Password1` |
| User  | `user@dojo.api`  | `Password1` |

**OAuth Client:** `client_test_app` / `test-secret-do-not-use-in-production`

**Promo Codes:** `WELCOME100` (100% off TS course), `HALF-OFF` (50% off Next.js course)

## API Endpoints Summary

### Auth & OAuth2

| Method | Path                      | Auth   | Description          |
| ------ | ------------------------- | ------ | -------------------- |
| POST   | `/api/auth/register`      | Public | Register user        |
| POST   | `/api/oauth/token`        | Varies | Token endpoint       |
| POST   | `/api/oauth/revoke`       | Bearer | Revoke refresh token |
| GET    | `/api/oauth/userinfo`     | Bearer | Current user info    |
| GET    | `/api/oauth/clients`      | Admin  | List OAuth clients   |
| POST   | `/api/oauth/clients`      | Admin  | Create OAuth client  |
| DELETE | `/api/oauth/clients/{id}` | Admin  | Deactivate client    |

### Courses

| Method | Path                        | Auth   | Description              |
| ------ | --------------------------- | ------ | ------------------------ |
| GET    | `/api/courses`              | Public | List courses (paginated) |
| POST   | `/api/courses`              | Admin  | Create course            |
| GET    | `/api/courses/{id}`         | Public | Get course details       |
| PATCH  | `/api/courses/{id}`         | Admin  | Update course            |
| DELETE | `/api/courses/{id}`         | Admin  | Delete course            |
| PATCH  | `/api/courses/{id}/publish` | Admin  | Toggle publish           |

### Chapters

| Method | Path                                | Auth  | Description      |
| ------ | ----------------------------------- | ----- | ---------------- |
| POST   | `/api/courses/{id}/chapters`        | Admin | Create chapter   |
| PUT    | `/api/courses/{id}/chapters`        | Admin | Reorder chapters |
| PATCH  | `/api/courses/{id}/chapters/{chId}` | Admin | Update chapter   |
| DELETE | `/api/courses/{id}/chapters/{chId}` | Admin | Delete chapter   |

### Purchases & Progress

| Method | Path                               | Auth   | Description         |
| ------ | ---------------------------------- | ------ | ------------------- |
| POST   | `/api/courses/{id}/purchase`       | Bearer | Purchase course     |
| POST   | `/api/courses/{id}/validate-promo` | Bearer | Validate promo code |
| GET    | `/api/purchases`                   | Bearer | List purchases      |
| PUT    | `/api/progress/{chapterId}`        | Bearer | Update completion   |
| GET    | `/api/progress/course/{courseId}`  | Bearer | Get course progress |

### Promo Codes (Admin)

| Method | Path                                         | Auth  | Description       |
| ------ | -------------------------------------------- | ----- | ----------------- |
| GET    | `/api/admin/courses/{id}/promo-codes`        | Admin | List promo codes  |
| POST   | `/api/admin/courses/{id}/promo-codes`        | Admin | Create promo code |
| PATCH  | `/api/admin/courses/{id}/promo-codes/{pcId}` | Admin | Toggle active     |
| DELETE | `/api/admin/courses/{id}/promo-codes/{pcId}` | Admin | Delete            |

### Content

| Method       | Path                       | Auth         | Description            |
| ------------ | -------------------------- | ------------ | ---------------------- |
| GET/POST     | `/api/categories`          | Public/Admin | List/create categories |
| DELETE       | `/api/categories/{id}`     | Admin        | Delete category        |
| GET/POST     | `/api/tags`                | Public/Admin | List/create tags       |
| DELETE       | `/api/tags/{id}`           | Admin        | Delete tag             |
| GET/POST     | `/api/posts`               | Public/Admin | List/create posts      |
| PATCH/DELETE | `/api/posts/{id}`          | Admin        | Update/delete post     |
| GET/POST     | `/api/youtube-videos`      | Public/Admin | List/create videos     |
| PATCH/DELETE | `/api/youtube-videos/{id}` | Admin        | Update/delete video    |

### Upload & Admin

| Method | Path                    | Auth   | Description         |
| ------ | ----------------------- | ------ | ------------------- |
| POST   | `/api/upload`           | Admin  | Upload file         |
| GET    | `/api/uploads/{path}`   | Public | Serve uploaded file |
| GET    | `/api/admin/users`      | Admin  | List/search users   |
| PATCH  | `/api/admin/users/{id}` | Admin  | Update user         |

## Tech Stack

- **Next.js 16.2.1** — API routes only (App Router)
- **TypeScript** — Strict mode
- **Prisma 7.6.0** — ORM with MariaDB adapter
- **jose** — JWT signing/verification (HS256)
- **bcryptjs** — Password hashing (12 salt rounds)
- **Zod** — Request validation
- **@scalar/nextjs** — Interactive API documentation
