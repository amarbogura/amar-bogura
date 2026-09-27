import { z } from "zod";

import { clientSchema, serverSchema } from "./env";

const server = z.object(serverSchema);
const client = z.object(clientSchema);

const database = {
  DATABASE_URL: "postgresql://user:pass@ep-x-pooler.neon.tech/db",
  DATABASE_URL_UNPOOLED: "postgresql://user:pass@ep-x.neon.tech/db",
  BETTER_AUTH_SECRET: "s".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

describe("env schema", () => {
  it("requires database, auth and rate-limit credentials", () => {
    expect(server.safeParse({}).success).toBe(false);
  });

  it("applies defaults for everything else", () => {
    expect(server.parse(database)).toMatchObject({
      NODE_ENV: "development",
      SMS_PROVIDER: "console",
    });
    expect(client.parse({})).toEqual({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
  });

  it("rejects malformed URLs", () => {
    expect(server.safeParse({ ...database, DATABASE_URL: "not a url" }).success).toBe(false);
    expect(client.safeParse({ NEXT_PUBLIC_SITE_URL: "bogura" }).success).toBe(false);
  });

  it("rejects unknown SMS providers", () => {
    expect(server.safeParse({ ...database, SMS_PROVIDER: "carrier-pigeon" }).success).toBe(false);
  });

  it("requires a strong auth secret when set", () => {
    expect(server.safeParse({ ...database, BETTER_AUTH_SECRET: "short" }).success).toBe(false);
    expect(server.safeParse({ ...database, BETTER_AUTH_SECRET: "x".repeat(32) }).success).toBe(
      true,
    );
  });
});
