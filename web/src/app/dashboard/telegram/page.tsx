"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  Radio,
  Sparkles,
  ShoppingBag,
  Server,
  UserCheck,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  Zap,
  ShieldAlert,
  AlertTriangle,
  Bookmark,
} from "lucide-react";

type PresetKey = "order" | "server" | "user";

interface PresetItem {
  id: PresetKey;
  labelKey: string;
  badgeKey: string;
  icon: typeof ShoppingBag;
  templates: {
    MarkdownV2: string;
    HTML: string;
    "": string;
  };
}

const PRESET_TEMPLATES: Record<PresetKey, PresetItem> = {
  order: {
    id: "order",
    labelKey: "telegram.presetOrderLabel",
    badgeKey: "telegram.presetOrderBadge",
    icon: ShoppingBag,
    templates: {
      MarkdownV2: `*🚨 NEW ORDER NOTIFICATION 🚨*
━━━━━━━━━━━━━━━━━━━━━
📦 *Event:* \`order\\.created\`
🆔 *Order ID:* \`\\#ORD\\-98421\`
👤 *Customer:* \`Ali Rezaei\`
💰 *Total Amount:* \`1,450,000 IRR\`
💳 *Gateway:* \`ZarinPal\`
📊 *Status:* *PAID* 🟢
━━━━━━━━━━━━━━━━━━━━━
📋 *Object Payload \\(JSON\\):*
\`\`\`json
{
  "event": "order.created",
  "orderId": "ORD-98421",
  "customer": {
    "name": "Ali Rezaei",
    "phone": "+989123456789",
    "email": "customer@example.com"
  },
  "items": [
    {
      "sku": "PROD-101",
      "name": "Cloudflare Pro Notify",
      "quantity": 1,
      "unitPrice": 1450000
    }
  ],
  "payment": {
    "gateway": "ZarinPal",
    "trackingCode": "ZP-993821049",
    "currency": "IRR",
    "isSuccess": true
  },
  "metadata": {
    "clientIp": "185.190.22.4",
    "userAgent": "TelegramNotify/2.0"
  },
  "timestamp": "2026-11-18T11:45:00Z"
}
\`\`\`
🌐 [Open Order in Management Panel](https://example.com/orders/98421)`,

      HTML: `<b>🚨 NEW ORDER NOTIFICATION 🚨</b>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Event:</b> <code>order.created</code>
🆔 <b>Order ID:</b> <code>#ORD-98421</code>
👤 <b>Customer:</b> <code>Ali Rezaei</code>
💰 <b>Total Amount:</b> <code>1,450,000 IRR</code>
💳 <b>Gateway:</b> <code>ZarinPal</code>
📊 <b>Status:</b> <b>PAID</b> 🟢
━━━━━━━━━━━━━━━━━━━━━
📋 <b>Object Payload (JSON):</b>
<pre><code class="language-json">{
  "event": "order.created",
  "orderId": "ORD-98421",
  "customer": {
    "name": "Ali Rezaei",
    "phone": "+989123456789",
    "email": "customer@example.com"
  },
  "items": [
    {
      "sku": "PROD-101",
      "name": "Cloudflare Pro Notify",
      "quantity": 1,
      "unitPrice": 1450000
    }
  ],
  "payment": {
    "gateway": "ZarinPal",
    "trackingCode": "ZP-993821049",
    "currency": "IRR",
    "isSuccess": true
  },
  "metadata": {
    "clientIp": "185.190.22.4",
    "userAgent": "TelegramNotify/2.0"
  },
  "timestamp": "2026-11-18T11:45:00Z"
}</code></pre>
🌐 <a href="https://example.com/orders/98421">Open Order in Management Panel</a>`,

      "": `🚨 NEW ORDER NOTIFICATION 🚨
━━━━━━━━━━━━━━━━━━━━━
Event: order.created
Order ID: #ORD-98421
Customer: Ali Rezaei
Total Amount: 1,450,000 IRR
Gateway: ZarinPal
Status: PAID 🟢
━━━━━━━━━━━━━━━━━━━━━
Object Payload (JSON):
{
  "event": "order.created",
  "orderId": "ORD-98421",
  "customer": {
    "name": "Ali Rezaei",
    "phone": "+989123456789"
  },
  "amount": 1450000,
  "currency": "IRR",
  "status": "PAID"
}
Link: https://example.com/orders/98421`,
    },
  },

  server: {
    id: "server",
    labelKey: "telegram.presetServerLabel",
    badgeKey: "telegram.presetServerBadge",
    icon: Server,
    templates: {
      MarkdownV2: `*⚠️ CRITICAL INFRASTRUCTURE ALERT ⚠️*
━━━━━━━━━━━━━━━━━━━━━
🖥️ *Host:* \`edge\\-worker\\-eu1\`
📈 *Incident:* *High Memory & Spike Load*
⚡ *Severity:* *CRITICAL* 🔴
⏱️ *Uptime:* \`99\\.98%\`
━━━━━━━━━━━━━━━━━━━━━
📋 *Telemetry Object \\(JSON\\):*
\`\`\`json
{
  "alertId": "ALT-40491",
  "service": "api-gateway",
  "host": "edge-worker-eu1",
  "region": "eu-central",
  "metrics": {
    "cpuUsage": "84.2%",
    "memoryUsage": "91.8%",
    "requestRate": "1,420 req/s",
    "errorRate": "0.4%"
  },
  "status": "CRITICAL",
  "environment": "production",
  "timestamp": "2026-11-18T11:45:00Z"
}
\`\`\`
🛠️ [Open Grafana Incident Dashboard](https://grafana.example.com/alerts/40491)`,

      HTML: `<b>⚠️ CRITICAL INFRASTRUCTURE ALERT ⚠️</b>
━━━━━━━━━━━━━━━━━━━━━
🖥️ <b>Host:</b> <code>edge-worker-eu1</code>
📈 <b>Incident:</b> <b>High Memory & Spike Load</b>
⚡ <b>Severity:</b> <b>CRITICAL</b> 🔴
⏱️ <b>Uptime:</b> <code>99.98%</code>
━━━━━━━━━━━━━━━━━━━━━
📋 <b>Telemetry Object (JSON):</b>
<pre><code class="language-json">{
  "alertId": "ALT-40491",
  "service": "api-gateway",
  "host": "edge-worker-eu1",
  "region": "eu-central",
  "metrics": {
    "cpuUsage": "84.2%",
    "memoryUsage": "91.8%",
    "requestRate": "1,420 req/s",
    "errorRate": "0.4%"
  },
  "status": "CRITICAL",
  "environment": "production",
  "timestamp": "2026-11-18T11:45:00Z"
}</code></pre>
🛠️ <a href="https://grafana.example.com/alerts/40491">Open Grafana Incident Dashboard</a>`,

      "": `⚠️ CRITICAL INFRASTRUCTURE ALERT ⚠️
━━━━━━━━━━━━━━━━━━━━━
Host: edge-worker-eu1
Incident: High Memory & Spike Load
Severity: CRITICAL 🔴
Uptime: 99.98%
━━━━━━━━━━━━━━━━━━━━━
Telemetry Object (JSON):
{
  "alertId": "ALT-40491",
  "service": "api-gateway",
  "host": "edge-worker-eu1",
  "metrics": {
    "cpuUsage": "84.2%",
    "memoryUsage": "91.8%"
  },
  "status": "CRITICAL"
}
Link: https://grafana.example.com/alerts/40491`,
    },
  },

  user: {
    id: "user",
    labelKey: "telegram.presetUserLabel",
    badgeKey: "telegram.presetUserBadge",
    icon: UserCheck,
    templates: {
      MarkdownV2: `*👤 NEW USER REGISTRATION*
━━━━━━━━━━━━━━━━━━━━━
📱 *Phone:* \`\\+989123456789\`
🌍 *Country:* \`Iran \\(IR\\)\`
🛡️ *Auth Mode:* \`Argon2id \\+ JWT\`
✅ *Status:* *ACTIVE* 🟢
━━━━━━━━━━━━━━━━━━━━━
📋 *User Object \\(JSON\\):*
\`\`\`json
{
  "event": "user.registered",
  "userId": "usr_99120485",
  "phoneNumber": "+989123456789",
  "role": "MEMBER",
  "security": {
    "argon2Hashed": true,
    "jwtSigned": true,
    "ipAddress": "5.200.14.88",
    "device": "Desktop/Chrome"
  },
  "status": "ACTIVE",
  "createdAt": "2026-11-18T11:45:00Z"
}
\`\`\`
👥 [View User Profile in Admin](https://example.com/users/usr_99120485)`,

      HTML: `<b>👤 NEW USER REGISTRATION</b>
━━━━━━━━━━━━━━━━━━━━━
📱 <b>Phone:</b> <code>+989123456789</code>
🌍 <b>Country:</b> <code>Iran (IR)</code>
🛡️ <b>Auth Mode:</b> <code>Argon2id + JWT</code>
✅ <b>Status:</b> <b>ACTIVE</b> 🟢
━━━━━━━━━━━━━━━━━━━━━
📋 <b>User Object (JSON):</b>
<pre><code class="language-json">{
  "event": "user.registered",
  "userId": "usr_99120485",
  "phoneNumber": "+989123456789",
  "role": "MEMBER",
  "security": {
    "argon2Hashed": true,
    "jwtSigned": true,
    "ipAddress": "5.200.14.88",
    "device": "Desktop/Chrome"
  },
  "status": "ACTIVE",
  "createdAt": "2026-11-18T11:45:00Z"
}</code></pre>
👥 <a href="https://example.com/users/usr_99120485">View User Profile in Admin</a>`,

      "": `👤 NEW USER REGISTRATION
━━━━━━━━━━━━━━━━━━━━━
Phone: +989123456789
Country: Iran (IR)
Auth Mode: Argon2id + JWT
Status: ACTIVE 🟢
━━━━━━━━━━━━━━━━━━━━━
User Object (JSON):
{
  "event": "user.registered",
  "userId": "usr_99120485",
  "phoneNumber": "+989123456789",
  "status": "ACTIVE"
}
Link: https://example.com/users/usr_99120485`,
    },
  },
};

export default function TelegramDashboardPage() {
  const { user, refreshUser } = useAuth();
  const { t, isRtl } = useI18n();

  // Add Bot state
  const [botToken, setBotToken] = useState("");
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [botSuccess, setBotSuccess] = useState<string | null>(null);
  const [botError, setBotError] = useState<string | null>(null);

  // Add Channel state
  const [selectedBotIdForChannel, setSelectedBotIdForChannel] = useState("");
  const [channelTitle, setChannelTitle] = useState("");
  const [channelChatId, setChannelChatId] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelSuccess, setChannelSuccess] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Direct Test Dispatcher state
  const [testBotId, setTestBotId] = useState("");
  const [testChatId, setTestChatId] = useState("");
  const [parseMode, setParseMode] = useState<"HTML" | "MarkdownV2" | "">("HTML");
  const [activePreset, setActivePreset] = useState<PresetKey>("order");
  const [testText, setTestText] = useState(PRESET_TEMPLATES.order.templates.HTML);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);

  useEffect(() => {
    api.templates.list().then(setUserTemplates).catch(() => {});
  }, []);

  const handleLoadUserTemplate = (tpl: any) => {
    const mode = (tpl.parseMode as "HTML" | "MarkdownV2" | "") || "MarkdownV2";
    setParseMode(mode);
    setTestText(tpl.content);
    setTestSuccess(`Loaded saved template: ${tpl.title}`);
    setTimeout(() => setTestSuccess(null), 3000);
  };

  const bots = user?.telegramBots || [];
  const hasDedicatedWorker = Boolean(user?.deployments && user.deployments.length > 0);
  const fallbackCount = user?.fallbackCallCount || 0;
  const trialLimitReached = !hasDedicatedWorker && fallbackCount >= 10;
  const remainingTrialCalls = Math.max(0, 10 - fallbackCount);

  useEffect(() => {
    if (bots.length > 0) {
      if (!selectedBotIdForChannel) setSelectedBotIdForChannel(bots[0].id);
      if (!testBotId) setTestBotId(bots[0].id);

      const firstBot = bots[0];
      if (firstBot.channels && firstBot.channels.length > 0 && !testChatId) {
        setTestChatId(firstBot.channels[0].chatId);
      }
    }
  }, [bots, selectedBotIdForChannel, testBotId, testChatId]);

  // Handle format change from select dropdown
  const handleParseModeChange = (newMode: "HTML" | "MarkdownV2" | "") => {
    setParseMode(newMode);
    setTestText(PRESET_TEMPLATES[activePreset].templates[newMode]);
  };

  // Handle preset switch from buttons
  const handleSelectPreset = (key: PresetKey) => {
    setActivePreset(key);
    setTestText(PRESET_TEMPLATES[key].templates[parseMode]);
  };

  // Reset or reload current template preset
  const handleResetTemplate = () => {
    setTestText(PRESET_TEMPLATES[activePreset].templates[parseMode]);
  };

  // Copy payload text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(testText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotSuccess(null);
    setBotError(null);
    setIsAddingBot(true);

    try {
      await api.telegram.addBot({ botToken });
      setBotSuccess("Bot successfully registered and verified!");
      setBotToken("");
      await refreshUser();
    } catch (err: any) {
      setBotError(err.message || "Failed to add bot. Please verify the Bot Token.");
    } finally {
      setIsAddingBot(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setChannelSuccess(null);
    setChannelError(null);
    setIsAddingChannel(true);

    try {
      await api.telegram.addChannel({
        botId: selectedBotIdForChannel,
        chatId: channelChatId,
        title: channelTitle,
      });
      setChannelSuccess("Channel/Chat successfully verified and linked!");
      setChannelTitle("");
      setChannelChatId("");
      await refreshUser();
    } catch (err: any) {
      setChannelError(err.message || "Failed to link channel. Make sure the bot is an admin in the channel.");
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSuccess(null);
    setTestError(null);
    setIsSendingTest(true);

    try {
      const res = await api.telegram.sendTest({
        botId: testBotId,
        chatId: testChatId,
        text: testText,
        parseMode: parseMode || undefined,
      });

      if (res.usedCustomWorker) {
        setTestSuccess("Test message delivered via your dedicated Cloudflare Worker! (Unlimited Mode)");
      } else if (res.remainingTrialCalls !== null && res.remainingTrialCalls !== undefined) {
        setTestSuccess(
          `Test message delivered via system proxy! (${res.remainingTrialCalls} of 10 fallback trial calls remaining)`
        );
      } else {
        setTestSuccess("Test message successfully delivered to Telegram!");
      }

      await refreshUser();
    } catch (err: any) {
      setTestError(err.message || "Failed to send message.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{t("telegram.title")}</h1>
        <p className="text-slate-400 mt-1">
          {t("telegram.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form 1: Add Bot */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t("telegram.addBotTitle")}</h2>
              <p className="text-xs text-slate-400">{t("telegram.addBotSubtitle")}</p>
            </div>
          </div>

          {botSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{botSuccess}</span>
            </div>
          )}

          {botError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{botError}</span>
            </div>
          )}

          <form onSubmit={handleAddBot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.botTokenLabel")}
              </label>
              <input
                type="password"
                required
                dir={isRtl ? (botToken ? "ltr" : "rtl") : "ltr"}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder={t("telegram.botTokenPlaceholder")}
                className={`w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isRtl ? (botToken ? "text-left" : "text-right") : "text-left"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isAddingBot}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isAddingBot ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{t("telegram.verifyAddBotBtn")}</span>
            </button>
          </form>
        </div>

        {/* Form 2: Link Channel / Chat */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t("telegram.linkChannelTitle")}</h2>
              <p className="text-xs text-slate-400">{t("telegram.linkChannelSubtitle")}</p>
            </div>
          </div>

          {channelSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{channelSuccess}</span>
            </div>
          )}

          {channelError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{channelError}</span>
            </div>
          )}

          <form onSubmit={handleAddChannel} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.selectBotLabel")}
              </label>
              <select
                value={selectedBotIdForChannel}
                onChange={(e) => setSelectedBotIdForChannel(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.botName} (@{b.botUsername})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.channelTitleLabel")}
              </label>
              <input
                type="text"
                required
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                placeholder={t("telegram.channelTitlePlaceholder")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.chatIdLabel")}
              </label>
              <input
                type="text"
                required
                dir={isRtl ? (channelChatId ? "ltr" : "rtl") : "ltr"}
                value={channelChatId}
                onChange={(e) => setChannelChatId(e.target.value)}
                placeholder={t("telegram.chatIdPlaceholder")}
                className={`w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm ${
                  isRtl ? (channelChatId ? "text-left" : "text-right") : "text-left"
                }`}
              />
            </div>

            <div className={`p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1.5 ${isRtl ? "text-right" : "text-left"}`}>
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{t("telegram.chatIdGuideTitle")}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-400 leading-relaxed">
                <li>{t("telegram.chatIdGuidePrereq")}</li>
                <li>{t("telegram.chatIdGuideOptionA")}</li>
                <li>{t("telegram.chatIdGuideOptionB")}</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isAddingChannel || bots.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isAddingChannel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{t("telegram.verifyLinkChannelBtn")}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Direct Test Message Sender UI with Structured Object Presets */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t("telegram.dispatcherTitle")}</h2>
              <p className="text-xs text-slate-400">
                {t("telegram.dispatcherSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasDedicatedWorker ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {t("telegram.unlimitedMode")}
              </span>
            ) : trialLimitReached ? (
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                {t("telegram.trialLimitReached")}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t("telegram.trialRemaining").replace("{remaining}", String(remainingTrialCalls))}
              </span>
            )}
            <button
              type="button"
              onClick={handleResetTemplate}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              title={t("telegram.resetExample")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("telegram.resetExample")}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              title={t("telegram.copyPayload")}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t("telegram.copied") : t("telegram.copyPayload")}</span>
            </button>
          </div>
        </div>

        {testSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testSuccess}</span>
          </div>
        )}

        {testError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{testError}</span>
          </div>
        )}

        {trialLimitReached && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                {t("telegram.trialLimitWarning")}
              </span>
            </div>
            <Link
              href="/dashboard/cloudflare"
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs whitespace-nowrap transition-colors"
            >
              {t("telegram.deployWorkerLink")}
            </Link>
          </div>
        )}

        {!hasDedicatedWorker && !trialLimitReached && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {t("telegram.tempProxyNotice").replace("{remaining}", String(remainingTrialCalls))}
              </span>
            </div>
            <Link
              href="/dashboard/cloudflare"
              className="text-amber-400 hover:text-amber-300 underline font-medium text-[11px] whitespace-nowrap"
            >
              {t("telegram.deployWorkerUnlimitedLink")}
            </Link>
          </div>
        )}

        <form onSubmit={handleSendTest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.senderBotLabel")}
              </label>
              <select
                value={testBotId}
                onChange={(e) => setTestBotId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.botName} (@{b.botUsername})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.targetChatIdLabel")}
              </label>
              <input
                type="text"
                required
                dir={isRtl ? (testChatId ? "ltr" : "rtl") : "ltr"}
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                placeholder="e.g. -1001987654321"
                className={`w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm ${
                  isRtl ? (testChatId ? "text-left" : "text-right") : "text-left"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("telegram.formattingLabel")}
              </label>
              <select
                value={parseMode}
                onChange={(e) => handleParseModeChange(e.target.value as "HTML" | "MarkdownV2" | "")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="HTML">{t("telegram.htmlMode")}</option>
                <option value="MarkdownV2">{t("telegram.markdownMode")}</option>
                <option value="">{t("telegram.plainMode")}</option>
              </select>
            </div>
          </div>

          {/* Structured Object Presets Selector */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                {t("telegram.presetSelectorTitle")}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {t("telegram.formatLabel")} {parseMode || "Plain Text"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(PRESET_TEMPLATES) as PresetKey[]).map((key) => {
                const item = PRESET_TEMPLATES[key];
                const IconComponent = item.icon;
                const isSelected = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPreset(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-purple-600/15 border-purple-500/50 text-white shadow-sm shadow-purple-900/20"
                        : "bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-purple-400" : "text-slate-500"}`} />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200">{t(item.labelKey)}</div>
                      <div className="text-[10px] text-slate-400">{t(item.badgeKey)}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saved Templates Selector */}
            {userTemplates.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Bookmark className="w-3.5 h-3.5" />
                    {t("telegram.loadSavedTemplates")}
                  </span>
                  <Link
                    href="/dashboard/templates"
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {t("telegram.manageTemplatesLink")}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleLoadUserTemplate(tpl)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-2 transition-all shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span className="font-medium">{tpl.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono px-1 py-0.5 rounded bg-slate-950">
                        {tpl.parseMode || "MarkdownV2"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                {t("telegram.messageContentLabel").replace("{mode}", parseMode || "Plain Text")}
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {t("telegram.charsLines")
                  .replace("{chars}", String(testText.length))
                  .replace("{lines}", String(testText.split("\n").length))}
              </span>
            </div>
            <textarea
              rows={11}
              required
              dir="ltr"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isSendingTest || bots.length === 0 || trialLimitReached}
            className="py-2.5 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>
              {trialLimitReached ? t("telegram.dispatchBtnDisabled") : t("telegram.dispatchBtn")}
            </span>
          </button>
        </form>
      </div>

      {/* Bots & Linked Channels Directory */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">{t("telegram.registeredBotsTitle")}</h2>

        {bots.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            {t("telegram.noBots")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bots.map((bot) => (
              <div key={bot.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{bot.botName}</h3>
                    <p className="text-xs text-blue-400 font-mono" dir="ltr">@{bot.botUsername}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {t("telegram.activeStatus")}
                  </span>
                </div>

                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-xs font-medium text-slate-400 block mb-2">
                    {t("telegram.linkedChannels").replace("{count}", String(bot.channels?.length || 0))}
                  </span>
                  {bot.channels && bot.channels.length > 0 ? (
                    <ul className="space-y-1.5 text-xs">
                      {bot.channels.map((c) => (
                        <li key={c.id} className="flex items-center justify-between text-slate-300">
                          <span>{c.title}</span>
                          <span className="font-mono text-slate-500" dir="ltr">{c.chatId}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-600 italic">
                      {t("telegram.noChannelsLinked")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
