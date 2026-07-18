// Re-export the shared pure slug utility so existing infrastructure imports
// (e.g. the author repository wiring) keep working.
export { slugify, SLUG_PATTERN } from "@/application/shared/slug";
