import { Thing, WithContext } from "schema-dts";

export function JsonLd({ schema }: { schema: WithContext<Thing> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
