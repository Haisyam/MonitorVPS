export const SESSION_COOKIE = "dashboard_session";

function getSecret() {
  return process.env.DASHBOARD_AUTH_SECRET || process.env.DASHBOARD_PASSWORD;
}

function base64UrlToUint8(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function hmacSign(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return uint8ToBase64Url(new Uint8Array(signature));
}

export async function verifySessionToken(token) {
  const secret = getSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [timestamp, nonce, signature] = parts;
  const payload = `${timestamp}.${nonce}`;
  const expected = await hmacSign(secret, payload);
  if (signature.length !== expected.length) return false;
  const sigBytes = base64UrlToUint8(signature);
  const expBytes = base64UrlToUint8(expected);
  if (sigBytes.length !== expBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < sigBytes.length; i += 1) {
    diff |= sigBytes[i] ^ expBytes[i];
  }
  if (diff !== 0) return false;
  const issued = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(issued)) return false;
  const ttl = Number.parseInt(process.env.DASHBOARD_SESSION_TTL_SEC || "86400", 10);
  const ttlMs = Number.isFinite(ttl) ? ttl * 1000 : 86_400_000;
  return Date.now() - issued <= ttlMs;
}
