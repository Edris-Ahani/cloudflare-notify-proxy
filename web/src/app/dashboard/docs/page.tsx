"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Copy, CheckCircle2, Terminal, Shield, Bot, Cloud } from "lucide-react";

export default function DocsPage() {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeDeployment = user?.deployments?.[0];
  const workerEndpoint = activeDeployment?.workerUrl || "https://your-worker-name.workers.dev";
  const apiKey = activeDeployment?.apiSecretKey || "YOUR_WORKER_API_KEY";

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const curlSimple = `curl -X POST "${workerEndpoint}/send/telegram" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello from Cloudflare Worker!"
  }'`;

  const curlMarkdown = `curl -X POST "${workerEndpoint}/send/telegram" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chat_id": "-1001987654321",
    "text": "*System Alert*\\nStatus: *HEALTHY* 🟢\\nNode: \`edge-01\`",
    "parse_mode": "MarkdownV2"
  }'`;

  const curlFields = `curl -X POST "${workerEndpoint}/send/telegram" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Server Crash Alert",
    "fields": {
      "Environment": "Production",
      "Memory": "94%",
      "Action": "Auto-Restarted"
    }
  }'`;

  const curlGet = `curl "${workerEndpoint}/send/telegram?text=Quick+Ping" \\
  -H "Authorization: Bearer ${apiKey}"`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          API & Platform Documentation
        </h1>
        <p className="text-slate-400 mt-1">
          Complete step-by-step guides and copy-paste cURL examples customized for your account.
        </p>
      </div>

      {/* Guide Section 1: Cloudflare Setup */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Cloud className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            1. How to get Cloudflare Account ID & API Token
          </h2>
        </div>

        <ol className="list-decimal list-inside space-y-2.5 text-sm text-slate-300">
          <li>
            Log in to the Cloudflare Dashboard at{" "}
            <a
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline"
            >
              dash.cloudflare.com
            </a>
            .
          </li>
          <li>
            Go to <strong>Workers & Pages</strong> in the left sidebar. Look at the right sidebar to copy your 32-character <strong>Account ID</strong>.
          </li>
          <li>
            Click your profile icon (top right) ➔ <strong>My Profile</strong> ➔ <strong>API Tokens</strong>.
          </li>
          <li>
            Click <strong>Create Token</strong> ➔ scroll to <strong>Create Custom Token</strong> ➔ click <strong>Get started</strong>.
          </li>
          <li>
            Configure permissions:
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
              <li><code className="text-amber-400">Account</code> ➔ <code className="text-amber-400">Workers Scripts</code> ➔ <code className="text-amber-400">Edit</code></li>
              <li><code className="text-amber-400">User</code> ➔ <code className="text-amber-400">Memberships</code> ➔ <code className="text-amber-400">Read</code></li>
            </ul>
          </li>
          <li>
            Click <strong>Continue to summary</strong> ➔ <strong>Create Token</strong>. Copy the generated token immediately and save it in the Cloudflare Workers tab.
          </li>
        </ol>
      </div>

      {/* Guide Section 2: Telegram Bot & Channels */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            2. How to create a Telegram Bot and find Channel Chat ID
          </h2>
        </div>

        <ol className="list-decimal list-inside space-y-2.5 text-sm text-slate-300">
          <li>
            Open Telegram and search for <strong>@BotFather</strong>.
          </li>
          <li>
            Send <code className="text-emerald-400 font-mono">/newbot</code>, choose a display name and a unique username ending in <code className="text-emerald-400 font-mono">bot</code>.
          </li>
          <li>
            BotFather will give you a <strong>HTTP API Token</strong> (e.g. <code className="text-emerald-400 font-mono">123456789:ABC...</code>).
          </li>
          <li>
            Add your bot to your Telegram Channel or Group as an <strong>Administrator</strong> with permission to <em>Post Messages</em>.
          </li>
          <li>
            To get a private channel ID, add <strong>@RawDataBot</strong> temporarily to the channel; it will reply with the numeric ID (starting with <code className="text-emerald-400 font-mono">-100...</code>).
          </li>
        </ol>
      </div>

      {/* Guide Section 3: Ready-to-use cURL Examples */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              3. Ready-to-Run cURL Examples
            </h2>
            <p className="text-xs text-slate-400">
              Values below are auto-filled with your deployed worker credentials
            </p>
          </div>
        </div>

        {/* Example A */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              A. Simple Text Message (POST)
            </span>
            <button
              onClick={() => copyCode(curlSimple, "curlSimple")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
            >
              {copiedId === "curlSimple" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy cURL
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-blue-300 overflow-x-auto border border-slate-800">
            {curlSimple}
          </pre>
        </div>

        {/* Example B */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              B. MarkdownV2 Formatted Alert
            </span>
            <button
              onClick={() => copyCode(curlMarkdown, "curlMarkdown")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
            >
              {copiedId === "curlMarkdown" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy cURL
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-purple-300 overflow-x-auto border border-slate-800">
            {curlMarkdown}
          </pre>
        </div>

        {/* Example C */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              C. Structured Crash Log / System Report (Fields Format)
            </span>
            <button
              onClick={() => copyCode(curlFields, "curlFields")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
            >
              {copiedId === "curlFields" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy cURL
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
            {curlFields}
          </pre>
        </div>

        {/* Example D */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              D. Simple GET Webhook (Suitable for monitors & uptime robots)
            </span>
            <button
              onClick={() => copyCode(curlGet, "curlGet")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
            >
              {copiedId === "curlGet" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy cURL
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
            {curlGet}
          </pre>
        </div>
      </div>
    </div>
  );
}
