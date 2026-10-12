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
    if (request.method === "GET" && path === "/auth/google/start") {
      return handleGoogleAuthStart(request, env, headers);
    }

    // Google OAuth: callback from Google
    if (request.method === "GET" && path === "/auth/google/callback") {
      return handleGoogleAuthCallback(request, env, headers);
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
