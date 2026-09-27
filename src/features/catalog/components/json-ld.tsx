import { type JsonLd as JsonLdData, serializeJsonLd } from "../jsonld";

/** Inline structured data. Content is escaped by serializeJsonLd (no </script> breakout). */
export function JsonLd({ data }: { data: Array<JsonLdData | null> }) {
  const items = data.filter((item): item is JsonLdData => item !== null);
  if (!items.length) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(items.length === 1 ? items[0]! : items) }}
    />
  );
}
