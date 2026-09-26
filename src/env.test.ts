import { z } from "zod";

import { clientSchema, serverSchema } from "./env";

const server = z.object(serverSchema);
const client = z.object(clientSchema);

describe("env schema", () => {
  it("accepts an empty environment with defaults applied", () => {
    expect(server.parse({})).toMatchObject({ NODE_ENV: "development", SMS_PROVIDER: "console" });
    expect(client.parse({})).toEqual({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
  });

  it("rejects malformed URLs", () => {
    expect(server.safeParse({ DATABASE_URL: "not a url" }).success).toBe(false);
    expect(client.safeParse({ NEXT_PUBLIC_SITE_URL: "bogura" }).success).toBe(false);
  });

  it("rejects unknown SMS providers", () => {
    expect(server.safeParse({ SMS_PROVIDER: "carrier-pigeon" }).success).toBe(false);
  });

  it("requires a strong auth secret when set", () => {
    expect(server.safeParse({ BETTER_AUTH_SECRET: "short" }).success).toBe(false);
    expect(server.safeParse({ BETTER_AUTH_SECRET: "x".repeat(32) }).success).toBe(true);
  });
});
