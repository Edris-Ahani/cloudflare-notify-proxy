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
  const {
    text,
    chat_id,
    fields,
    title = "Notification",
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

    return new Response("Not Found", { status: 404, headers });
  },
};
`;
