import type { Locale } from "./config";

/** A dictionary: nested groups of strings (plural pairs are `{ one, other }` groups). */
export interface MessageTree {
  readonly [key: string]: string | MessageTree;
}

/** Same shape as `T`, every leaf a string (lets `en.ts` be checked against `bn.ts`). */
export type ShapeOf<T> = { readonly [K in keyof T]: T[K] extends string ? string : ShapeOf<T[K]> };

/** Dotted paths to string leaves: "requests.success.title". */
export type MessageKey<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : MessageKey<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Dotted paths to plural groups (`{ one, other }`). */
export type PluralKey<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends { one: string; other: string }
      ? `${Prefix}${K}`
      : PluralKey<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type Values = Record<string, string | number>;

function lookup(messages: MessageTree, key: string): string | MessageTree | undefined {
  let node: string | MessageTree | undefined = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, part)) return undefined;
    node = node[part];
  }
  return node;
}

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

export interface Translator<T> {
  (key: MessageKey<T>, values?: Values): string;
  /** `{ one, other }` group chosen by `count` (Bangla has one form; English has two). */
  plural: (key: PluralKey<T>, count: number, values?: Values) => string;
  locale: Locale;
}

/**
 * `t("requests.success.title", { code })`. Unknown keys return the key itself (visible in dev,
 * never a crash); the types make that a compile error anyway.
 */
export function createTranslator<T extends MessageTree>(
  messages: T,
  locale: Locale,
): Translator<T> {
  const t = ((key: string, values?: Values) => {
    const node = lookup(messages, key);
    return typeof node === "string" ? interpolate(node, values) : key;
  }) as Translator<T>;
  t.plural = (key: string, count: number, values?: Values) => {
    const node = lookup(messages, key);
    if (typeof node !== "object" || node === null) return key;
    const form = new Intl.PluralRules(locale === "bn" ? "bn" : "en").select(count);
    const template = (form === "one" ? node.one : node.other) ?? node.other;
    return typeof template === "string" ? interpolate(template, { count, ...values }) : key;
  };
  t.locale = locale;
  return t;
}
