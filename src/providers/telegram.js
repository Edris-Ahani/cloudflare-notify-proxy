export async function sendTelegramMessage(env, payload) {
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
  if (msg.length > 4096) msg = msg.slice(0, 4090) + "…"; // Telegram limit safeguard

  const body = {
    chat_id: chatId,
    text: msg,
    parse_mode: parse_mode !== undefined ? parse_mode : (text ? undefined : "MarkdownV2"),
    disable_web_page_preview: disable_web_page_preview ?? true,
    ...extra,
  };

  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const jsonResp = await r.json().catch(() => ({}));
  
  // Map Telegram response to reasonable HTTP status
  const httpStatus = r.ok
    ? 200
    : (r.status >= 400 && r.status < 500 ? 400 : 502);

  return {
    status: httpStatus,
    body: { httpStatus: r.status, ...jsonResp },
  };
}

function formatFields(fields, title = "Notification") {
  const entries = Object.entries(fields || {});
  const maxKey = entries.length ? Math.max(...entries.map(([k]) => k.length)) : 0;
  const lines = entries.map(([k, v]) => {
    const val = v == null ? String(v) : (typeof v === "string" ? v : JSON.stringify(v));
    return `${k.padEnd(maxKey, " ")} : ${val}`;
  });
  return [`*${escapeMd(title)}*`, "```", ...lines, "```"].join("\n");
}

function escapeMd(s = "") {
  return String(s).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
