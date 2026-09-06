import { readdir, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Design prototypes are plain static bundles dropped into
 * `public/prototypes/` — a Claude Design export (`*.dc.html`) plus whatever
 * sibling files it imports (`ios-frame.jsx`, `support.js`, images, ...).
 *
 * Keeping them in `public/` means the browser fetches them straight from the
 * static file server, so the export's own relative imports (`./support.js`)
 * resolve without any rewriting on our side. The pages under `/prototype` are
 * only chrome around that: an index and a device-framed viewer.
 *
 * Every consumer of this module is statically generated at build time, which
 * is why reading the directory with `fs` is safe: on serverless hosts
 * `public/` exists during the build but is served by the CDN at runtime.
 */
const PROTOTYPE_DIR = path.join(process.cwd(), "public", "prototypes");
const DESIGN_EXTENSION = ".dc.html";

export type Prototype = {
  /** URL segment, e.g. `o-wellness-ui`. */
  slug: string;
  /** Human title derived from the file name, e.g. `O Wellness UI`. */
  title: string;
  /** File name as exported, e.g. `O Wellness UI.dc.html`. */
  fileName: string;
  /** Public URL of the raw export. */
  href: string;
  /** Last modified time, ISO 8601. */
  updatedAt: string;
};

function toSlug(baseName: string): string {
  return baseName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listPrototypes(): Promise<Prototype[]> {
  let entries: string[];
  try {
    entries = await readdir(PROTOTYPE_DIR);
  } catch {
    // The directory is intentionally allowed to be empty (or absent) — the
    // index page renders drop-in instructions in that case.
    return [];
  }

  const designs = entries.filter((name) => name.endsWith(DESIGN_EXTENSION));

  const prototypes = await Promise.all(
    designs.map(async (fileName) => {
      const baseName = fileName.slice(0, -DESIGN_EXTENSION.length);
      const { mtime } = await stat(path.join(PROTOTYPE_DIR, fileName));
      return {
        slug: toSlug(baseName),
        title: baseName,
        fileName,
        href: `/prototypes/${encodeURIComponent(fileName)}`,
        updatedAt: mtime.toISOString(),
      } satisfies Prototype;
    }),
  );

  return prototypes.sort((a, b) => a.title.localeCompare(b.title, "ko"));
}

export async function findPrototype(slug: string): Promise<Prototype | null> {
  const prototypes = await listPrototypes();
  return prototypes.find((prototype) => prototype.slug === slug) ?? null;
}
