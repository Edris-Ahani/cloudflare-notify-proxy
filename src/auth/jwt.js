const encoder = new TextEncoder();

function base64UrlEncode(data) {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeToJson(value) {
  const bytes = base64UrlDecodeToBytes(value);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJwt(payload, secret, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(body)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function verifyJwt(token, secret) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  let header;
  let payload;
  try {
    header = base64UrlDecodeToJson(encodedHeader);
    payload = base64UrlDecodeToJson(encodedPayload);
  } catch {
    return null;
  }

  if (header.alg !== "HS256") {
    return null;
  }

  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecodeToBytes(encodedSignature),
    encoder.encode(signingInput)
  );

  if (!valid) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) {
    return null;
  }

  return payload;
}
