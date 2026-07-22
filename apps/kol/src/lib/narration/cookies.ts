/**
 * Engine boundary cookie names — fixed here by the FIRST engine consumer
 * (B5) and binding on every later one (B1 feed, B6 product page).
 * createEngineDeps (W2-WIRE) leaves the names to its caller; if two
 * surfaces picked different names the anti-repetition ring and the
 * session-jitter scope would fragment across buyer states, and a clip
 * played at FEED could repeat at NARRATE_SHRINK. Import these — never
 * inline a string.
 */

/** Signed anti-repetition key ring (engine cookie-ring.ts owns the format). */
export const ENGINE_RING_COOKIE = "kol_film_ring";

/** Buyer session scope — seeds ranking jitter and bounds the ring. */
export const ENGINE_SESSION_COOKIE = "kol_sid";
