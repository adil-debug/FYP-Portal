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

const adapter = new PrismaPg(connectionString);

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
