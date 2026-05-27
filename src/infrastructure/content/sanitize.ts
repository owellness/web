import DOMPurify from "isomorphic-dompurify";

// Tiptap content is trusted in the sense that only authenticated admins write
// it, but we still sanitize on save to defend against accidental script tags
// or paste-injection bugs. The default isomorphic-dompurify profile blocks
// script/iframe/event handlers, which matches our threat model.
export const sanitizeHtml = (dirty: string): string =>
  DOMPurify.sanitize(dirty, {
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
  });
