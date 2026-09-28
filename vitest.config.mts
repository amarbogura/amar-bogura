import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Cloudflare's public always-pass Turnstile test key (NEXT_PUBLIC_* is not loaded by Vite).
    env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" },
    include: ["src/**/*.test.{ts,tsx}", "prisma/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
