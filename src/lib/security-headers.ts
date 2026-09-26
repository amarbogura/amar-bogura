export type Header = { key: string; value: string };

/**
 * Baseline CSP. Nonces are intentionally not used: they force dynamic rendering, and public pages
 * must stay static/ISR. Hosts: Cloudinary (images/uploads), Cloudflare Turnstile (guest anti-spam).
 * Tighten (analytics domains, hashes) in P15.
 */
export function buildCsp(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      "https://api.cloudinary.com",
      "https://challenges.cloudflare.com",
      ...(isDev ? ["ws:"] : []),
    ],
    "frame-src": ["https://challenges.cloudflare.com"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function securityHeaders(isDev: boolean): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: buildCsp(isDev) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
    },
  ];
  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }
  return headers;
}
