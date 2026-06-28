// Client-side OWTI funnel beacons. Fire-and-forget; never throws and never
// blocks the UI. Records only anonymous progress + final type — no answers.

const ENDPOINT = "/api/owti/events";
const SID_KEY = "owti-sid";

export type OwtiBeacon =
  | { type: "start" }
  | { type: "advance"; step: number }
  | { type: "complete"; code: string };

let cachedId: string | null = null;

const genId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

/** Stable anonymous id for this browser session (persisted, with a fallback
 * cached in-memory so all events from one page load still share an id). */
export function getOwtiSessionId(): string {
  if (cachedId) return cachedId;
  try {
    let id = sessionStorage.getItem(SID_KEY);
    if (!id) {
      id = genId();
      sessionStorage.setItem(SID_KEY, id);
    }
    cachedId = id;
    return id;
  } catch {
    cachedId = genId();
    return cachedId;
  }
}

export function trackOwtiEvent(event: OwtiBeacon): void {
  try {
    const body = JSON.stringify({ sessionId: getOwtiSessionId(), ...event });
    // sendBeacon survives the page navigation that follows "complete".
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
    } else if (typeof fetch !== "undefined") {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* analytics is best-effort */
  }
}
