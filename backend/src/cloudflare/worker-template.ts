// Standalone Cloudflare Worker script template deployed to user's Cloudflare account

export const WORKER_SCRIPT_TEMPLATE = `
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

function verifyApiKey(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  return Boolean(env.API_SECRET_KEY && token === env.API_SECRET_KEY);
}

function formatFields(fields, title = "Notification") {
  const entries = Object.entries(fields || {});
  const maxKey = entries.length ? Math.max(...entries.map(([k]) => k.length)) : 0;
  const lines = entries.map(([k, v]) => {
    const val = v == null ? String(v) : (typeof v === "string" ? v : JSON.stringify(v));
    return \`\${k.padEnd(maxKey, " ")} : \${val}\`;
  });
  return [\`*\${escapeMd(title)}*\`, "\`\`\`", ...lines, "\`\`\`"].join("\\n");
}

function escapeMd(s = "") {
  return String(s).replace(/([_*\\[\\]()~\\x60>#+\\-=|{}.!\\\\])/g, "\\\\$1");
}

async function sendTelegramMessage(env, payload) {
  const isFa = payload.lang === "fa" || env.DEFAULT_LANG === "fa";
  const {
    text,
    chat_id,
    fields,
    title = isFa ? "اعلان سیستمی" : "Notification",
    parse_mode,
    disable_web_page_preview,
    ...extra
  } = payload;

  const chatId = chat_id ?? env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!chatId) {
    return { status: 400, body: { ok: false, error: "chat_id is missing and TELEGRAM_DEFAULT_CHAT_ID is not set" } };
  }

  if (!text && (!fields || typeof fields !== "object")) {
    return { status: 400, body: { ok: false, error: "text or fields required" } };
  }

  let msg = text ?? formatFields(fields, title);
  if (msg.length > 4096) msg = msg.slice(0, 4090) + "…";

  const body = {
    chat_id: chatId,
    text: msg,
    parse_mode: parse_mode !== undefined ? parse_mode : (text ? undefined : "MarkdownV2"),
    disable_web_page_preview: disable_web_page_preview ?? true,
    ...extra,
  };

  const r = await fetch(\`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const jsonResp = await r.json().catch(() => ({}));
  const httpStatus = r.ok ? 200 : (r.status >= 400 && r.status < 500 ? 400 : 502);

  return {
    status: httpStatus,
    body: { httpStatus: r.status, ...jsonResp },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = corsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET" && path === "/") {
      return jsonResponse({ ok: true, service: "cloudflare-notify-worker" }, 200, headers);
    }

    // Inbound Webhook Proxy from Telegram to Backend (Telegram -> Cloudflare Worker -> Backend)
    if (request.method === "POST" && (path === "/tg-webhook" || path.startsWith("/tg-webhook/"))) {
      let destinationUrl = env.BACKEND_WEBHOOK_URL || url.searchParams.get("target");

      if (!destinationUrl) {
        const defaultHost = env.FRONTEND_URL || "https://notify.ozonecowork.ir";
        destinationUrl = \`\${defaultHost.replace(/\\/$/, "")}/api/telegram/webhook\`;
      }

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
        return jsonResponse({ ok: false, error: "Unauthorized: Invalid or missing Bearer token" }, 401, headers);
      }

      const telegramPath = path.replace("/tg-proxy", "");
      const targetUrl = \`https://api.telegram.org\${telegramPath}\${url.search}\`;

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

    if ((request.method === "POST" || request.method === "GET") && path.startsWith("/send/telegram")) {
      if (!verifyApiKey(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized: Invalid or missing Bearer token" }, 401, headers);
      }

      if (!env.TELEGRAM_BOT_TOKEN) {
        return jsonResponse({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured on this worker" }, 500, headers);
      }

      let payload = {};
      if (request.method === "POST") {
        payload = await request.json().catch(() => ({}));
      } else if (request.method === "GET") {
        payload = {
          text: url.searchParams.get("text"),
          chat_id: url.searchParams.get("chat_id"),
          parse_mode: url.searchParams.get("parse_mode") || undefined,
        };
      }

      const result = await sendTelegramMessage(env, payload);
      return jsonResponse(result.body, result.status, headers);
    }

    // -------------------------------------------------------------
    // Google OAuth Edge Gateway Endpoints
    // -------------------------------------------------------------

    // 1. Generate Google Authorization URL
    if (request.method === "GET" && (path === "/auth/google/url" || path === "/google/auth-url")) {
      const redirectUri = url.searchParams.get("redirect_uri");
      const clientId = url.searchParams.get("client_id") || env.GOOGLE_CLIENT_ID;
      const scope = url.searchParams.get("scope") || "openid email profile";
      const state = url.searchParams.get("state");
      const prompt = url.searchParams.get("prompt") || "consent";
      const accessType = url.searchParams.get("access_type") || "offline";

      if (!clientId) {
        return jsonResponse(
          { ok: false, error: "GOOGLE_CLIENT_ID is not configured on this worker. Pass client_id query parameter." },
          400,
          headers
        );
      }

      if (!redirectUri) {
        return jsonResponse(
          { ok: false, error: "redirect_uri query parameter is required" },
          400,
          headers
        );
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        access_type: accessType,
        prompt,
      });

      if (state) {
        params.append("state", state);
      }

      const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

      return jsonResponse(
        {
          ok: true,
          url: googleAuthUrl,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
        },
        200,
        headers
      );
    }

    // 2. Exchange Authorization Code for Tokens and User Profile
    if (
      request.method === "POST" &&
      (path === "/auth/google/token" || path === "/auth/google/user" || path === "/google/exchange-token")
    ) {
      if (!verifyApiKey(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized: Invalid or missing Bearer token" }, 401, headers);
      }

      const body = await request.json().catch(() => ({}));
      const code = body.code || url.searchParams.get("code");
      const redirectUri = body.redirect_uri || url.searchParams.get("redirect_uri");
      const clientId = body.client_id || env.GOOGLE_CLIENT_ID;
      const clientSecret = body.client_secret || env.GOOGLE_CLIENT_SECRET;

      if (!code || !redirectUri) {
        return jsonResponse(
          { ok: false, error: "code and redirect_uri parameters are required" },
          400,
          headers
        );
      }

      if (!clientId || !clientSecret) {
        return jsonResponse(
          { ok: false, error: "Google OAuth credentials missing. Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET or pass in body." },
          400,
          headers
        );
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
        return jsonResponse(
          {
            ok: false,
            error: tokenData.error_description || tokenData.error || "Token exchange with Google failed",
            details: tokenData,
          },
          tokenResp.status,
          headers
        );
      }

      // Fetch user profile using access token
      let userProfile = null;
      if (tokenData.access_token) {
        const userResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: "Bearer " + tokenData.access_token },
        });
        userProfile = await userResp.json().catch(() => null);
      }

      return jsonResponse(
        {
          ok: true,
          user: userProfile,
          tokens: tokenData,
        },
        200,
        headers
      );
    }

    // 3. Transparent Reverse Proxy for Google APIs (/google-proxy/*)
    if (path.startsWith("/google-proxy/")) {
      if (!verifyApiKey(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized: Invalid or missing Bearer token" }, 401, headers);
      }

      const subPath = path.replace("/google-proxy", "");
      let targetBase = "https://www.googleapis.com";
      if (subPath.startsWith("/token") || subPath.startsWith("/oauth2/token") || subPath.startsWith("/revoke")) {
        targetBase = "https://oauth2.googleapis.com";
      }

      const targetUrl = targetBase + subPath + url.search;

      const forwardHeaders = new Headers();
      if (request.headers.get("content-type")) {
        forwardHeaders.set("content-type", request.headers.get("content-type"));
      }
      if (request.headers.get("authorization")) {
        forwardHeaders.set("authorization", request.headers.get("authorization"));
      }

      const init = {
        method: request.method,
        headers: forwardHeaders,
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = await request.text();
      }

      const googleResp = await fetch(targetUrl, init);
      const googleData = await googleResp.json().catch(() => ({}));

      return jsonResponse(googleData, googleResp.status, headers);
    }

    return new Response("Not Found", { status: 404, headers });
  },
};
`;
