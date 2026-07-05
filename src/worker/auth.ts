const COOKIE_NAME = "enduro_auth";
const COOKIE_VALUE = "ok";

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
}

export async function createAuthCookie(secret: string, isHttps: boolean): Promise<string> {
  const sig = await hmac(secret, COOKIE_VALUE);
  const secureAttr = isHttps ? "Secure; " : "";
  return `${COOKIE_NAME}=${COOKIE_VALUE}.${sig}; HttpOnly; ${secureAttr}SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function verifyAuthCookie(cookieHeader: string | null, secret: string): Promise<boolean> {
  if (!cookieHeader) return false;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );
  const raw = cookies[COOKIE_NAME];
  if (!raw) return false;
  const dotIdx = raw.lastIndexOf(".");
  if (dotIdx <= 0) return false;
  const value = raw.slice(0, dotIdx);
  const sig = raw.slice(dotIdx + 1);
  if (value !== COOKIE_VALUE) return false;
  const expectedSig = await hmac(secret, value);
  return timingSafeEqual(sig, expectedSig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyPasscode(submitted: string, expected: string): Promise<boolean> {
  return timingSafeEqual(submitted, expected);
}
