import { z } from "zod";

// SiteSetting values are JSON edited by admins (P12); parse defensively so a bad row can't break
// every page. Pure module (no DB) so it's unit-testable.

const phoneValue = z.object({ phone: z.string().nullable().catch(null) }).catch({ phone: null });

export const siteSettingsSchema = z.object({
  hotline: phoneValue,
  whatsapp: phoneValue,
  ambulance_phone: phoneValue,
  emergency_chip: z.object({ enabled: z.boolean().catch(true) }).catch({ enabled: true }),
  social_links: z
    .object({
      facebook: z.string().nullable().catch(null),
      youtube: z.string().nullable().catch(null),
    })
    .catch({ facebook: null, youtube: null }),
});

export interface SiteSettings {
  hotline: string | null;
  whatsapp: string | null;
  ambulancePhone: string | null;
  emergencyChipEnabled: boolean;
  facebookUrl: string | null;
  youtubeUrl: string | null;
}

export function parseSiteSettings(rows: Array<{ key: string; value: unknown }>): SiteSettings {
  const raw = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const parsed = siteSettingsSchema.parse({
    hotline: raw.hotline,
    whatsapp: raw.whatsapp,
    ambulance_phone: raw.ambulance_phone,
    emergency_chip: raw.emergency_chip,
    social_links: raw.social_links,
  });
  return {
    hotline: parsed.hotline.phone,
    whatsapp: parsed.whatsapp.phone,
    ambulancePhone: parsed.ambulance_phone.phone,
    emergencyChipEnabled: parsed.emergency_chip.enabled,
    facebookUrl: parsed.social_links.facebook,
    youtubeUrl: parsed.social_links.youtube,
  };
}
