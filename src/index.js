import { verifyApiKey, unauthorizedResponse } from "./auth.js";
import { verifyJwt } from "./auth/jwt.js";
import { handleGoogleAuthStart, handleGoogleAuthCallback } from "./auth/google.js";
import { sendTelegramMessage } from "./providers/telegram.js";
import { triggerCoolifyDeploy } from "./providers/coolify.js";

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function extractBearerToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = corsHeaders();

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    // Health check endpoint
    if (request.method === "GET" && path === "/") {
      return jsonResponse({ ok: true, service: "cloudflare-notify" }, 200, headers);
    }

    // Google OAuth: start login / signup
    if (request.method === "GET" && (path === "/auth/google/start" || path === "/auth/google/url" || path === "/google/auth-url")) {
      const redirectUri = url.searchParams.get("redirect_uri");
      const clientId = url.searchParams.get("client_id") || env.GOOGLE_CLIENT_ID;
      const scope = url.searchParams.get("scope") || "openid email profile";
      const state = url.searchParams.get("state");

      if (path === "/auth/google/url" || path === "/google/auth-url") {
        if (!clientId) {
          return jsonResponse({ ok: false, error: "GOOGLE_CLIENT_ID missing" }, 400, headers);
        }
        if (!redirectUri) {
          return jsonResponse({ ok: false, error: "redirect_uri required" }, 400, headers);
        }
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope,
          access_type: "offline",
          prompt: "consent",
        });
        if (state) params.append("state", state);
        return jsonResponse({ ok: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` }, 200, headers);
      }

      return handleGoogleAuthStart(request, env, headers);
    }

    // Google OAuth: exchange token and fetch user profile
    if (
      request.method === "POST" &&
      (path === "/auth/google/token" || path === "/auth/google/user" || path === "/google/exchange-token")
    ) {
      if (!verifyApiKey(request, env)) {
        return unauthorizedResponse(headers);
      }
      const body = await request.json().catch(() => ({}));
      const code = body.code || url.searchParams.get("code");
      const redirectUri = body.redirect_uri || url.searchParams.get("redirect_uri");
      const clientId = body.client_id || env.GOOGLE_CLIENT_ID;
      const clientSecret = body.client_secret || env.GOOGLE_CLIENT_SECRET;

      if (!code || !redirectUri || !clientId || !clientSecret) {
        return jsonResponse({ ok: false, error: "Missing required parameters: code, redirect_uri, client_id, client_secret" }, 400, headers);
      }

      const tokenParams = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });
      const tokenData = await tokenResp.json().catch(() => ({}));
      if (!tokenResp.ok) {
        return jsonResponse({ ok: false, error: tokenData.error_description || "Google token exchange failed" }, tokenResp.status, headers);
      }

      let userProfile = null;
      if (tokenData.access_token) {
        const userResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        userProfile = await userResp.json().catch(() => null);
      }

      return jsonResponse({ ok: true, user: userProfile, tokens: tokenData }, 200, headers);
    }

    // Google OAuth: callback from Google
    if (request.method === "GET" && path === "/auth/google/callback") {
      return handleGoogleAuthCallback(request, env, headers);
    }

    // Google API Reverse Proxy (/google-proxy/*)
    if (path.startsWith("/google-proxy/")) {
      if (!verifyApiKey(request, env)) {
        return unauthorizedResponse(headers);
      }
      const subPath = path.replace("/google-proxy", "");
      let targetBase = "https://www.googleapis.com";
      if (subPath.startsWith("/token") || subPath.startsWith("/oauth2/token") || subPath.startsWith("/revoke")) {
        targetBase = "https://oauth2.googleapis.com";
      }
      const targetUrl = `${targetBase}${subPath}${url.search}`;
      const forwardHeaders = new Headers();
      if (request.headers.get("content-type")) forwardHeaders.set("content-type", request.headers.get("content-type"));
      if (request.headers.get("authorization")) forwardHeaders.set("authorization", request.headers.get("authorization"));

      const init = { method: request.method, headers: forwardHeaders };
      if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.text();

      const gResp = await fetch(targetUrl, init);
      const gData = await gResp.json().catch(() => ({}));
      return jsonResponse(gData, gResp.status, headers);
    }

    // Current user from Worker-issued JWT
    if (request.method === "GET" && path === "/auth/me") {
      if (!env.JWT_SECRET) {
        return jsonResponse({ ok: false, error: "JWT_SECRET is not configured" }, 500, headers);
      }

      const token = extractBearerToken(request);
      const payload = await verifyJwt(token, env.JWT_SECRET);
      if (!payload) {
        return unauthorizedResponse(headers);
      }

      return jsonResponse(
        {
          ok: true,
          user: {
            id: payload.sub,
            email: payload.email,
            name: payload.name || "",
            picture: payload.picture || "",
            provider: payload.provider || "google",
          },
        },
        200,
        headers
      );
    }

    // Inbound Webhook Proxy from Telegram to Backend (Telegram -> Cloudflare Worker -> Backend)
    if (request.method === "POST" && (path === "/tg-webhook" || path.startsWith("/tg-webhook/"))) {
      let destinationUrl = env.BACKEND_WEBHOOK_URL || url.searchParams.get("target");

      if (!destinationUrl) {
        const defaultHost = env.FRONTEND_URL || "https://notify.ozonecowork.ir";
        destinationUrl = `${defaultHost.replace(/\/$/, "")}/api/telegram/webhook`;
      }

      // Validate optional secret token if configured on worker
      if (env.TELEGRAM_WEBHOOK_SECRET) {
        const receivedSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
        if (receivedSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
          return jsonResponse({ ok: false, error: "Invalid webhook secret token" }, 403, headers);
        }
      }

      const updatePayload = await request.text();

      const forwardHeaders = new Headers({
        "Content-Type": "application/json",
      });

      const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secretHeader) {
        forwardHeaders.set("X-Telegram-Bot-Api-Secret-Token", secretHeader);
      }

      try {
        const backendResp = await fetch(destinationUrl, {
          method: "POST",
          headers: forwardHeaders,
          body: updatePayload,
        });

        const backendData = await backendResp.json().catch(() => ({ ok: backendResp.ok }));
        return jsonResponse(backendData, backendResp.status, headers);
      } catch {
        return jsonResponse({ ok: false, error: "Failed to forward update to backend" }, 502, headers);
      }
    }

    // Secure Reverse Proxy for all Telegram API methods (getMe, getChat, sendMessage, etc.)
    if (path.startsWith("/tg-proxy/")) {
      if (!verifyApiKey(request, env)) {
        return unauthorizedResponse(headers);
      }

      const telegramPath = path.replace("/tg-proxy", "");
      const targetUrl = `https://api.telegram.org${telegramPath}${url.search}`;

      const forwardHeaders = new Headers();
      if (request.headers.get("content-type")) {
        forwardHeaders.set("content-type", request.headers.get("content-type"));
      }

      const init = {
        method: request.method,
        headers: forwardHeaders,
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = await request.text();
      }

      const tgResp = await fetch(targetUrl, init);
      const tgData = await tgResp.json().catch(() => ({}));

      return jsonResponse(tgData, tgResp.status, headers);
    }

    // Endpoint: POST or GET /send/:provider
    if ((request.method === "POST" || request.method === "GET") && path.startsWith("/send/")) {
      // 1. Verify Authentication
      if (!verifyApiKey(request, env)) {
        return unauthorizedResponse(headers);
      }

      // Split the path to extract provider and optional sub-identifier
      // e.g. "/send/coolify/api" -> ["coolify", "api"]
      const pathParts = path.replace("/send/", "").toLowerCase().split("/");
      const provider = pathParts[0];
      const subId = pathParts[1] || "";

      let payload = {};
      if (request.method === "POST") {
        payload = await request.json().catch(() => ({}));
      }

      // 2. Route to appropriate provider
      if (provider === "telegram") {
        if (!env.TELEGRAM_BOT_TOKEN) {
          return jsonResponse({ ok: false, error: "Telegram is not configured" }, 500, headers);
        }

        const result = await sendTelegramMessage(env, payload);
        return jsonResponse(result.body, result.status, headers);
      }

      if (provider === "coolify") {
        const result = await triggerCoolifyDeploy(env, subId);
        return jsonResponse(result.body, result.status, headers);
      }

      // Future providers (e.g., discord, slack) can be added here
      // else if (provider === 'discord') { ... }

      return jsonResponse({ ok: false, error: `Provider '${provider}' not supported` }, 404, headers);
    }

    return new Response("Not Found", { status: 404 });
  },
};
