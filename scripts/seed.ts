import "dotenv/config";

import { CATEGORIES } from "../src/config/site";
import { categoryService, faqService, pageService } from "../src/composition";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Add it to .env or .env.local.");
    process.exit(1);
  }

  console.log("Seeding categories…");
  await categoryService.ensureSeeded();
  for (const cat of CATEGORIES) {
    console.log(`  ✓ ${cat.slug} (${cat.name})`);
  }

  console.log("Seeding FAQ…");
  await faqService.ensureSeeded();

  console.log("Seeding pages (소개)…");
  await pageService.ensureSeeded();

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
