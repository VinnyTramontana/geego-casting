# Geego Casting

Investment casting quote & order platform built with Next.js, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/geego_casting?schema=public`)
- `ADMIN_PASSWORD` — password for the `/admin` dashboard

See `.env.example` for all available variables.

### 3. Set up the database

```bash
# Create the initial migration and apply it
npx prisma migrate dev --name init

# (Or in production, apply existing migrations)
npx prisma migrate deploy
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Migrations

This project uses [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) with PostgreSQL.

```bash
# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name describe_your_change

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio to browse data
npx prisma studio
```

## Deploy on Vercel

The easiest way to deploy is via the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to:
1. Provision a PostgreSQL database (e.g. Vercel Postgres, Neon, Supabase, or Railway)
2. Set `DATABASE_URL` in your Vercel environment variables
3. Add a build command or postinstall script that runs `npx prisma migrate deploy`
