import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter — there is no more implicit
// built-in connection handling. We build one from DATABASE_URL.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your .env file (see prisma7.config.ts).",
  );
}

// Each Vercel serverless function instance runs its own Node process, so
// this pool is effectively "the connections one instance holds open to
// Neon." Left at the pg default (no cap), a burst of concurrent requests
// hitting a single warm instance could open far more physical connections
// than a serverless workload needs — costly against Neon's pooled
// endpoint, which is designed around many callers each holding very few
// connections. Capping it small (and using Neon's pooled/PgBouncer
// connection string — see README's Neon setup section) is the standard
// pattern for Postgres-from-serverless.
const adapter = new PrismaPg({
  connectionString,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

// Prevents exhausting the database connection pool during Next.js dev
// hot-reloading, which would otherwise create a new PrismaClient (and a
// new connection pool) on every file save.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
