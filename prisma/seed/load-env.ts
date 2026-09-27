import { loadEnvConfig } from "@next/env";

// Must be the first import of the seed so `@/env` sees .env / .env.local (same precedence as Next).
loadEnvConfig(process.cwd());
