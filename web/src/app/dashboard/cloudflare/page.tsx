"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
  ExternalLink,
  Zap,
  Key,
} from "lucide-react";

export default function CloudflareDashboardPage() {
  const { user, refreshUser } = useAuth();

  // Cloudflare credentials form
  const [accountId, setAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Deploy worker form
  const [selectedBotId, setSelectedBotId] = useState("");
  const [defaultChatId, setDefaultChatId] = useState("");
  const [scriptName, setScriptName] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Deployments list
  const [deployments, setDeployments] = useState<any[]>([]);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const loadDeployments = async () => {
    try {
      const data = await api.cloudflare.listDeployments();
      setDeployments(data);
    } catch {
      // ignore if empty
    }
  };

  useEffect(() => {
    if (user?.cloudflareConfig) {
      setAccountId(user.cloudflareConfig.accountId);
    }
    if (user?.telegramBots && user.telegramBots.length > 0) {
      setSelectedBotId(user.telegramBots[0].id);
    }
    loadDeployments();
  }, [user]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess(null);
    setConfigError(null);
    setIsSavingConfig(true);

    try {
      await api.cloudflare.saveConfig({ accountId, apiToken });
      setConfigSuccess("Cloudflare credentials verified and securely saved.");
      setApiToken("");
      await refreshUser();
    } catch (err: any) {
      setConfigError(err.message || "Failed to verify Cloudflare credentials.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeployWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploySuccess(null);
    setDeployError(null);
    setIsDeploying(true);

    try {
      const res = await api.cloudflare.deployWorker({
        botId: selectedBotId,
        defaultChatId: defaultChatId || undefined,
        scriptName: scriptName || undefined,
      });
      setDeploySuccess(`Worker '${res.deployment.scriptName}' successfully deployed!`);
      setScriptName("");
      await loadDeployments();
      await refreshUser();
    } catch (err: any) {
      setDeployError(err.message || "Worker deployment failed. Please check your credentials.");
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Cloudflare Workers</h1>
        <p className="text-slate-400 mt-1">
          Connect your Cloudflare account and deploy custom notification proxy workers on edge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: Cloudflare Account Credentials */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connect Cloudflare Account</h2>
              <p className="text-xs text-slate-400">Provide Account ID and Custom API Token</p>
            </div>
          </div>

          {configSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {configSuccess}
            </div>
          )}

          {configError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {configError}
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cloudflare Account ID
              </label>
              <input
                type="text"
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. 9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cloudflare API Token
              </label>
              <input
                type="password"
                required={!user?.cloudflareConfig}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={user?.cloudflareConfig ? "•••••••••••••••••••••••• (Saved)" : "Custom API Token with Workers:Edit permission"}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Token requires <span className="text-slate-400">Account: Workers Scripts: Edit</span> permission.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isSavingConfig ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify & Save Credentials"
              )}
            </button>
          </form>
        </div>

        {/* Step 2: Deploy Worker UI */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">1-Click Worker Deployer</h2>
              <p className="text-xs text-slate-400">Provision isolated worker on your account</p>
            </div>
          </div>

          {deploySuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {deploySuccess}
            </div>
          )}

          {deployError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {deployError}
            </div>
          )}

          <form onSubmit={handleDeployWorker} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Telegram Bot
              </label>
              {user?.telegramBots && user.telegramBots.length > 0 ? (
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {user.telegramBots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.botName} (@{bot.botUsername})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400 py-1">
                  No bots registered. Please add a bot in the Telegram section first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Channel Chat ID (Optional)
              </label>
              <input
                type="text"
                value={defaultChatId}
                onChange={(e) => setDefaultChatId(e.target.value)}
                placeholder="e.g. -100123456789 or @mychannel"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Worker Script Name (Optional)
              </label>
              <input
                type="text"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder="e.g. notify-production"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isDeploying || !user?.cloudflareConfig || !user?.telegramBots?.length}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Deploy to My Cloudflare Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Section 3: Deployed Workers Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">Deployed Workers</h2>

        {deployments.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No workers deployed yet. Complete the steps above to launch your first edge worker.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Script Name</th>
                  <th className="py-3 px-4">Worker Endpoint</th>
                  <th className="py-3 px-4">API Secret Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {d.scriptName}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={d.workerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-mono text-xs"
                      >
                        {d.workerUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 truncate max-w-[140px]">
                          {d.apiSecretKey}
                        </span>
                        <button
                          onClick={() => copyToClipboard(d.apiSecretKey, d.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Copy API Key"
                        >
                          {copiedKeyId === d.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
