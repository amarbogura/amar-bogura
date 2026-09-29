// E2E helper (dev only): creates / deletes a throwaway OPERATOR with an email+password login and a
// known TOTP secret, stored exactly like Better Auth's twoFactor plugin stores it.
//   pnpm tsx scripts/e2e-admin.ts create <email> <password>   → prints {"userId","secret"} (JSON)
//   pnpm tsx scripts/e2e-admin.ts delete <email>
import "../prisma/seed/load-env";

import { randomUUID } from "node:crypto";

import { PrismaNeon } from "@prisma/adapter-neon";
import { generateRandomString, hashPassword, symmetricEncrypt } from "better-auth/crypto";

import { env } from "@/env";
import { PrismaClient } from "@/generated/prisma/client";

const [command, emailArg, password] = process.argv.slice(2);
if (env.NODE_ENV === "production") throw new Error("Refusing to run in production");
if (!emailArg?.endsWith("@e2e.amarbogura.invalid"))
  throw new Error("E2E admins must use @e2e.amarbogura.invalid");
const email: string = emailArg;

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: env.DATABASE_URL_UNPOOLED }),
});
// No versioned `secrets` array is configured, so Better Auth encrypts with the plain secret.
const key = env.BETTER_AUTH_SECRET;

async function create() {
  if (!password) throw new Error("password required");
  await remove();
  const userId = randomUUID();
  const secret = generateRandomString(32);
  await db.user.create({
    data: {
      id: userId,
      name: "E2E Operator",
      email,
      emailVerified: true,
      role: "operator",
      twoFactorEnabled: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
      twofactors: {
        create: {
          id: randomUUID(),
          secret: await symmetricEncrypt({ key, data: secret }),
          backupCodes: await symmetricEncrypt({ key, data: JSON.stringify([]) }),
          verified: true,
        },
      },
    },
  });
  process.stdout.write(`${JSON.stringify({ userId, secret })}\n`);
}

async function remove() {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;
  await db.requestEvent.updateMany({ where: { actorId: user.id }, data: { actorId: null } });
  await db.serviceRequest.updateMany({
    where: { assignedToId: user.id },
    data: { assignedToId: null },
  });
  // Test-only actor: its audit rows are test data too.
  await db.auditLog.deleteMany({ where: { actorId: user.id } });
  await db.blockedPhone.deleteMany({ where: { createdById: user.id } });
  await db.user.delete({ where: { id: user.id } });
}

async function main() {
  try {
    if (command === "create") await create();
    else if (command === "delete") await remove();
    else throw new Error(`unknown command ${command}`);
  } finally {
    await db.$disconnect();
  }
}

void main();
