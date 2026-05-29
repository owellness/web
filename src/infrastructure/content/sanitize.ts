import sanitizeHtmlLib from "sanitize-html";

// Server-side HTML sanitizer for Tiptap-generated content.
//
// We use `sanitize-html` (pure JS, no jsdom) rather than DOMPurify so it runs
// cleanly on Vercel's serverless runtime — isomorphic-dompurify pulls in jsdom,
// whose transitive deps break under require()/ESM there.
//
// Tiptap content is authored only by authenticated admins, but we still
// sanitize on save to strip anything unexpected (pasted scripts, stray
// attributes) before it's stored and later rendered with dangerouslySetInnerHTML.

const allowedTags = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "s",
  "del",
  "code",
  "pre",
  "a",
  "br",
  "hr",
  "img",
  "span",
];

export const sanitizeHtml = (dirty: string): string =>
  sanitizeHtmlLib(dirty, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height"],
      span: ["class"],
      code: ["class"],
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Force safe rel on links that open in a new tab.
    transformTags: {
      a: (tagName, attribs) => {
        const attrs = { ...attribs };
        if (attrs.target === "_blank") {
          attrs.rel = "noopener noreferrer";
        }
        return { tagName, attribs: attrs };
      },
    },
  });
