/**
 * One-time bootstrap script: creates the first Coordinator account.
 *
 * There is no public sign-up page in this portal (by design — students
 * never log in, and faculty accounts are created BY the coordinator once
 * Phase 4 is built). This script is how you create that very first
 * coordinator account so you have something to log in with at all.
 *
 * Usage:
 *   npx tsx --require dotenv/config scripts/create-coordinator.ts \
 *     "Dr. Jane Doe" jane.doe@university.edu "a-strong-password"
 */
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error(
      "Usage: npx tsx --require dotenv/config scripts/create-coordinator.ts \"Full Name\" email@example.com \"password\"",
    );
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    console.error(`A user with email ${normalizedEmail} already exists.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: "COORDINATOR",
    },
  });

  console.log("Coordinator account created:");
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log("You can now log in at /login with this email and password.");
}

main()
  .catch((error) => {
    console.error("Failed to create coordinator account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
