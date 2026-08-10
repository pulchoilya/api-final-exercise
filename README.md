# Dojo API

Standalone REST API application with OAuth2 authentication and JWT tokens. Built with Next.js 16 (API routes only), Prisma 7, and MariaDB/MySQL.

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL or MariaDB database (see [mySqlInstall.md](mySqlInstall.md) для інструкцій із встановлення)

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

## Connecting to the Database

You can connect to the database using any MySQL-compatible client or GUI tool.

**Default connection details** (from `.env`):

| Parameter | Value              |
| --------- | ------------------ |
| Host      | `localhost`        |
| Port      | `3306`             |
| User      | `root`             |
| Password  | _(from your .env)_ |
| Database  | `dojo_api`         |

### CLI

```bash
mysql -u root -h localhost -P 3306 dojo_api
```

### GUI Tools

Use the same connection details above in any of these tools:

- **[DBeaver](https://dbeaver.io/)** (free, cross-platform)
- **[MySQL Workbench](https://www.mysql.com/products/workbench/)** (official MySQL GUI)
- **[TablePlus](https://tableplus.com/)** (macOS/Windows/Linux)
- **[DataGrip](https://www.jetbrains.com/datagrip/)** (JetBrains, paid)

### Prisma Studio

Prisma includes a built-in database browser:

```bash
npm run db:studio
```

This opens a web UI at `http://localhost:5555` where you can browse and edit all tables.

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
