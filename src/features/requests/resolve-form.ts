import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { FormSchema, I18n, ServiceFormPresets } from "@/features/forms/types";
import { bn as bnMessages } from "@/i18n/messages/bn";
import { en as enMessages } from "@/i18n/messages/en";
import type { RequestType } from "@/generated/prisma/enums";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";

export const GENERIC_TEMPLATE_KEY = "generic_service";
export const CUSTOM_TEMPLATE_KEY = "custom_request";

/** Everything a request page and `submitServiceRequest` need to render / validate one form. */
export interface RequestFormContext {
  type: RequestType;
  /** Draft key + what the success page links back to. */
  slug: string;
  /** Service (or "Custom request") name in both languages; pages pick one with tr(). */
  title: I18n;
  serviceId: string | null;
  categoryId: string | null;
  category: { slug: string; name: I18n } | null;
  allowGuest: boolean;
  isEmergency: boolean;
  presets: ServiceFormPresets;
  formVersionId: string;
  schema: FormSchema;
}

type VersionRef = { id: string; schema: unknown } | null | undefined;

const currentVersion = { select: { currentVersion: { select: { id: true, schema: true } } } };

async function templateVersion(key: string): Promise<VersionRef> {
  const template = await db.formTemplate.findUnique({ where: { key }, ...currentVersion });
  return template?.currentVersion;
}

function asPresets(value: unknown): ServiceFormPresets {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ServiceFormPresets)
    : {};
}

/**
 * The form for `/services/[slug]/request` (docs/04 P7): the service's own template → its category's
 * default → `generic_service`, always the **current published version from the DB** (its id is
 * stored on the request so DetailsView can use the same version later). ACTIVE services in an
 * ACTIVE category only; null → 404.
 */
export async function resolveServiceRequestForm(slug: string): Promise<RequestFormContext | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.catalog, TAGS.forms, TAGS.service(slug));

  const service = await db.service.findFirst({
    where: { slug, status: "ACTIVE", category: { status: "ACTIVE", kind: "SERVICE" } },
    select: {
      id: true,
      slug: true,
      nameBn: true,
      nameEn: true,
      allowGuest: true,
      isEmergency: true,
      formPresets: true,
      formTemplate: currentVersion,
      category: {
        select: {
          id: true,
          slug: true,
          nameBn: true,
          nameEn: true,
          defaultFormTemplate: currentVersion,
        },
      },
    },
  });
  if (!service) return null;

  const version =
    service.formTemplate?.currentVersion ??
    service.category.defaultFormTemplate?.currentVersion ??
    (await templateVersion(GENERIC_TEMPLATE_KEY));
  if (!version) return null;

  return {
    type: "SERVICE",
    slug: service.slug,
    title: { bn: service.nameBn, en: service.nameEn },
    serviceId: service.id,
    categoryId: service.category.id,
    category: {
      slug: service.category.slug,
      name: { bn: service.category.nameBn, en: service.category.nameEn },
    },
    allowGuest: service.allowGuest,
    isEmergency: service.isEmergency,
    presets: asPresets(service.formPresets),
    formVersionId: version.id,
    schema: version.schema as FormSchema,
  };
}

/** `/request/custom` (D-07): type CUSTOM, no service, the CUSTOM_REQUEST category. */
export async function resolveCustomRequestForm(): Promise<RequestFormContext | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.catalog, TAGS.forms);

  const [category, version] = await Promise.all([
    db.category.findFirst({
      where: { kind: "CUSTOM_REQUEST", status: "ACTIVE" },
      select: { id: true, slug: true, nameBn: true, nameEn: true },
    }),
    templateVersion(CUSTOM_TEMPLATE_KEY),
  ]);
  if (!version) return null;

  return {
    type: "CUSTOM",
    slug: "custom",
    title: { bn: bnMessages.requests.custom.title, en: enMessages.requests.custom.title },
    serviceId: null,
    categoryId: category?.id ?? null,
    category: category
      ? { slug: category.slug, name: { bn: category.nameBn, en: category.nameEn } }
      : null,
    allowGuest: true,
    isEmergency: false,
    presets: {},
    formVersionId: version.id,
    schema: version.schema as FormSchema,
  };
}

/** `/services/[slug]/request` pages prerendered at build (admin-added services render on demand). */
export async function getRequestFormStaticParams(): Promise<Array<{ slug: string }>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.catalog);
  return db.service.findMany({
    where: { status: "ACTIVE", category: { status: "ACTIVE", kind: "SERVICE" } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true },
  });
}
