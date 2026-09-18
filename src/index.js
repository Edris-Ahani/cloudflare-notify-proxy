import { verifyApiKey, unauthorizedResponse } from "./auth.js";
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Health check endpoint
    if (request.method === "GET" && path === "/") {
      return jsonResponse({ ok: true, service: "cloudflare-notify" }, 200, corsHeaders());
    }

    // Endpoint: POST or GET /send/:provider
    if ((request.method === "POST" || request.method === "GET") && path.startsWith("/send/")) {
      // 1. Verify Authentication
      if (!verifyApiKey(request, env)) {
        return unauthorizedResponse();
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
          return jsonResponse({ ok: false, error: "Telegram is not configured" }, 500, corsHeaders());
        }
        
        const result = await sendTelegramMessage(env, payload);
        return jsonResponse(result.body, result.status, corsHeaders());
      }
      
      if (provider === "coolify") {
        const result = await triggerCoolifyDeploy(env, subId);
        return jsonResponse(result.body, result.status, corsHeaders());
      }

      // Future providers (e.g., discord, slack) can be added here
      // else if (provider === 'discord') { ... }

      return jsonResponse({ ok: false, error: `Provider '${provider}' not supported` }, 404, corsHeaders());
    }

    return new Response("Not Found", { status: 404 });
  },
};
