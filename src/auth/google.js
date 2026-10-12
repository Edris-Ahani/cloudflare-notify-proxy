import { signJwt } from "./jwt.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const OAUTH_STATE_TTL_SECONDS = 600;

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getAllowedReturnOrigins(env) {
  return (env.ALLOWED_RETURN_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedReturnTo(returnTo, env) {
  let parsed;
  try {
    parsed = new URL(returnTo);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const allowed = getAllowedReturnOrigins(env);
  return allowed.includes(parsed.origin);
}

function buildRedirectWithAuthResult(returnTo, result) {
  const url = new URL(returnTo);
  url.searchParams.set("token", result.token);
  url.searchParams.set("is_new_user", result.isNewUser ? "true" : "false");
  url.searchParams.set("provider", "google");
  return url.toString();
}

function buildRedirectWithError(returnTo, errorCode) {
  const url = new URL(returnTo);
  url.searchParams.set("error", errorCode);
  url.searchParams.set("provider", "google");
  return url.toString();
}

async function upsertGoogleUser(env, profile) {
  const key = `user:google:${profile.sub}`;
  const existingRaw = await env.AUTH_KV.get(key);
  const now = new Date().toISOString();

  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    const updated = {
      ...existing,
      email: profile.email,
      name: profile.name || existing.name || "",
      picture: profile.picture || existing.picture || "",
      emailVerified: Boolean(profile.email_verified),
      lastLoginAt: now,
    };
    await env.AUTH_KV.put(key, JSON.stringify(updated));
    return { user: updated, isNewUser: false };
  }

  const created = {
    id: profile.sub,
    provider: "google",
    email: profile.email,
    name: profile.name || "",
    picture: profile.picture || "",
    emailVerified: Boolean(profile.email_verified),
    createdAt: now,
    lastLoginAt: now,
  };
  await env.AUTH_KV.put(key, JSON.stringify(created));
  return { user: created, isNewUser: true };
}

function assertGoogleConfig(env) {
  const missing = [];
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.GOOGLE_REDIRECT_URI) missing.push("GOOGLE_REDIRECT_URI");
  if (!env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!env.AUTH_KV) missing.push("AUTH_KV");
  if (getAllowedReturnOrigins(env).length === 0) missing.push("ALLOWED_RETURN_ORIGINS");

  if (missing.length > 0) {
    return `Google auth is not configured. Missing: ${missing.join(", ")}`;
  }
  return null;
}

export async function handleGoogleAuthStart(request, env, corsHeaders) {
  const configError = assertGoogleConfig(env);
  if (configError) {
    return jsonResponse({ ok: false, error: configError }, 500, corsHeaders);
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to");
  if (!returnTo) {
    return jsonResponse(
      { ok: false, error: "Missing required query param: return_to" },
      400,
      corsHeaders
    );
  }

  if (!isAllowedReturnTo(returnTo, env)) {
    return jsonResponse(
      { ok: false, error: "return_to origin is not allowed" },
      400,
      corsHeaders
    );
  }

  const state = randomToken(24);
  await env.AUTH_KV.put(
    `oauth:state:${state}`,
    JSON.stringify({ returnTo, createdAt: Date.now() }),
    { expirationTtl: OAUTH_STATE_TTL_SECONDS }
  );

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", env.GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
}

export async function handleGoogleAuthCallback(request, env, corsHeaders) {
  const configError = assertGoogleConfig(env);
  if (configError) {
    return jsonResponse({ ok: false, error: configError }, 500, corsHeaders);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (!state) {
    return jsonResponse({ ok: false, error: "Missing OAuth state" }, 400, corsHeaders);
  }

  const stateKey = `oauth:state:${state}`;
  const stateRaw = await env.AUTH_KV.get(stateKey);
  if (!stateRaw) {
    return jsonResponse({ ok: false, error: "Invalid or expired OAuth state" }, 400, corsHeaders);
  }
  await env.AUTH_KV.delete(stateKey);

  const { returnTo } = JSON.parse(stateRaw);

  if (oauthError) {
    return Response.redirect(buildRedirectWithError(returnTo, oauthError), 302);
  }

  if (!code) {
    return Response.redirect(buildRedirectWithError(returnTo, "missing_code"), 302);
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      console.error("Google token exchange failed:", tokenPayload);
      return Response.redirect(buildRedirectWithError(returnTo, "token_exchange_failed"), 302);
    }

    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = await userInfoResponse.json();

    if (!userInfoResponse.ok || !profile.sub || !profile.email) {
      console.error("Google userinfo failed:", profile);
      return Response.redirect(buildRedirectWithError(returnTo, "userinfo_failed"), 302);
    }

    if (profile.email_verified === false) {
      return Response.redirect(buildRedirectWithError(returnTo, "email_not_verified"), 302);
    }

    const { user, isNewUser } = await upsertGoogleUser(env, profile);
    const token = await signJwt(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: "google",
      },
      env.JWT_SECRET
    );

    return Response.redirect(
      buildRedirectWithAuthResult(returnTo, { token, isNewUser }),
      302
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return Response.redirect(buildRedirectWithError(returnTo, "internal_error"), 302);
  }
}
