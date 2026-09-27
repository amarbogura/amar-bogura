import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env / .env.local with the same precedence as Next.js.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  // Migrations use Neon's direct (unpooled) connection. Read from process.env rather than
  // Prisma's `env()` so `prisma generate` works in CI without a database URL.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED },
});
