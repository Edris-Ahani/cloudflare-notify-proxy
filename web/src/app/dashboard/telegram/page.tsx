"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
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
  label: string;
  badge: string;
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
    label: "Order & Payment Object",
    badge: "E-Commerce",
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
Link: https://example.com/orders/98421`,
    },
  },

  server: {
    id: "server",
    label: "Server & Incident Alert",
    badge: "DevOps",
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
Link: https://grafana.example.com/alerts/40491`,
    },
  },

  user: {
    id: "user",
    label: "User Registration Object",
    badge: "Auth / Security",
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
Link: https://example.com/users/usr_99120485`,
    },
  },
};

export default function TelegramDashboardPage() {
  const { user, refreshUser } = useAuth();

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
        <h1 className="text-3xl font-bold text-white tracking-tight">Telegram Bots & Channels</h1>
        <p className="text-slate-400 mt-1">
          Register your Telegram bots from BotFather and manage linked broadcast channels.
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
              <h2 className="text-lg font-semibold text-white">Add Telegram Bot</h2>
              <p className="text-xs text-slate-400">Tokens are encrypted at rest with hardware AES-256-GCM</p>
            </div>
          </div>

          {botSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {botSuccess}
            </div>
          )}

          {botError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {botError}
            </div>
          )}

          <form onSubmit={handleAddBot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Bot Token (from @BotFather)
              </label>
              <input
                type="password"
                required
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingBot}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isAddingBot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Verify & Add Bot
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
              <h2 className="text-lg font-semibold text-white">Link Channel / Chat</h2>
              <p className="text-xs text-slate-400">Connect a target channel where alerts will be dispatched</p>
            </div>
          </div>

          {channelSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {channelSuccess}
            </div>
          )}

          {channelError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {channelError}
            </div>
          )}

          <form onSubmit={handleAddChannel} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Bot
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
                Channel Title / Nickname
              </label>
              <input
                type="text"
                required
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                placeholder="e.g. Production Alerts Channel"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chat ID or @channelusername
              </label>
              <input
                type="text"
                required
                value={channelChatId}
                onChange={(e) => setChannelChatId(e.target.value)}
                placeholder="e.g. @my_channel or -1001987654321"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                How to find your Chat ID:
              </div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-amber-400">Prerequisite:</strong> First add your bot to the channel/group as an <strong>Administrator</strong> with &quot;Post Messages&quot; permission.
                </li>
                <li>
                  <strong className="text-slate-200">Option A (Public Channel):</strong> Simply enter the channel handle with <code className="text-emerald-400">@</code> (e.g. <code className="text-emerald-400">@my_alerts</code>).
                </li>
                <li>
                  <strong className="text-slate-200">Option B (Private Channel/Group):</strong> Forward any message from the channel to <code className="text-emerald-400">@RawDataBot</code> or <code className="text-emerald-400">@userinfobot</code> to receive the numeric ID (starts with <code className="text-emerald-400">-100...</code>).
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isAddingChannel || bots.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isAddingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Verify & Link Channel
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
              <h2 className="text-lg font-semibold text-white">Live Message Dispatcher</h2>
              <p className="text-xs text-slate-400">
                Send structured object notifications to your channel with syntax-highlighted code blocks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasDedicatedWorker ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Unlimited Worker Mode
              </span>
            ) : trialLimitReached ? (
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Trial Limit Reached (10/10)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Trial: {remainingTrialCalls}/10 Calls Left
              </span>
            )}
            <button
              type="button"
              onClick={handleResetTemplate}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              title="Reset template to default structured example"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Example
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              title="Copy message payload"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {testSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {testSuccess}
          </div>
        )}

        {testError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {testError}
          </div>
        )}

        {trialLimitReached && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                You have reached the maximum trial limit (10/10 test calls) via our system proxy. To continue sending unlimited messages, you must deploy your own dedicated worker.
              </span>
            </div>
            <Link
              href="/dashboard/cloudflare"
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs whitespace-nowrap transition-colors"
            >
              Deploy Worker in Cloudflare →
            </Link>
          </div>
        )}

        {!hasDedicatedWorker && !trialLimitReached && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Temporary System Proxy Mode: <strong>{remainingTrialCalls} of 10</strong> trial test calls remaining.
              </span>
            </div>
            <Link
              href="/dashboard/cloudflare"
              className="text-amber-400 hover:text-amber-300 underline font-medium text-[11px] whitespace-nowrap"
            >
              Deploy Worker for Unlimited Sends →
            </Link>
          </div>
        )}

        <form onSubmit={handleSendTest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sender Bot
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
                Target Chat ID
              </label>
              <input
                type="text"
                required
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                placeholder="e.g. -1001987654321"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Formatting (Parse Mode)
              </label>
              <select
                value={parseMode}
                onChange={(e) => handleParseModeChange(e.target.value as "HTML" | "MarkdownV2" | "")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="HTML">HTML (Recommended for Objects)</option>
                <option value="MarkdownV2">MarkdownV2 (Full Escaped Object)</option>
                <option value="">Plain Text (Raw Object)</option>
              </select>
            </div>
          </div>

          {/* Structured Object Presets Selector */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                Select Structured Object Payload Example:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Format: {parseMode || "Plain Text"}
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
                      <div className="font-semibold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.badge}</div>
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
                    Load from My Saved Templates:
                  </span>
                  <Link
                    href="/dashboard/templates"
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    + Manage Templates
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

            {/* Parse Mode Specific Architecture Advice */}
            <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
              {parseMode === "MarkdownV2" && (
                <p className="text-purple-300/90 leading-relaxed">
                  <strong className="text-purple-400">MarkdownV2 Object Format:</strong> Special characters outside code blocks (<code className="text-amber-400 font-mono">. - ! # ( ) [ ] _ * ~ ` &gt; + = | &#123; &#125;</code>) are escaped with a backslash (<code className="text-amber-400 font-mono">\.</code>), while JSON inside <code className="text-amber-400 font-mono">```json ... ```</code> remains clean and syntax-highlighted in Telegram.
                </p>
              )}
              {parseMode === "HTML" && (
                <p className="text-emerald-300/90 leading-relaxed">
                  <strong className="text-emerald-400">HTML Object Format:</strong> Uses standard <code className="text-emerald-400 font-mono">&lt;pre&gt;&lt;code class=&quot;language-json&quot;&gt;...&lt;/code&gt;&lt;/pre&gt;</code> for syntax-colored JSON blocks, with <code className="text-emerald-400 font-mono">&lt;b&gt;</code> labels and <code className="text-emerald-400 font-mono">&lt;code&gt;</code> inline tags.
                </p>
              )}
              {parseMode === "" && (
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Plain Text Object Format:</strong> Pure text with indented JSON payload, without any markup tags or entity escaping requirements.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Message Content ({parseMode || "Plain Text"} Payload)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {testText.length} characters / {testText.split("\n").length} lines
              </span>
            </div>
            <textarea
              rows={11}
              required
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
            {trialLimitReached ? "Trial Limit Reached (Deploy Worker)" : "Dispatch Live Notification"}
          </button>
        </form>
      </div>

      {/* Bots & Linked Channels Directory */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">Registered Bots & Channels</h2>

        {bots.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No bots registered yet. Add your bot token above to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bots.map((bot) => (
              <div key={bot.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{bot.botName}</h3>
                    <p className="text-xs text-blue-400">@{bot.botUsername}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-xs font-medium text-slate-400 block mb-2">
                    Linked Channels ({bot.channels?.length || 0}):
                  </span>
                  {bot.channels && bot.channels.length > 0 ? (
                    <ul className="space-y-1.5 text-xs">
                      {bot.channels.map((c) => (
                        <li key={c.id} className="flex items-center justify-between text-slate-300">
                          <span>{c.title}</span>
                          <span className="font-mono text-slate-500">{c.chatId}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-600 italic">No channels linked yet</span>
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
