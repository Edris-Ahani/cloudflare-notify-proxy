"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
  ExternalLink,
  Zap,
  Trash2,
} from "lucide-react";

export default function CloudflareDashboardPage() {
  const { user, refreshUser } = useAuth();
  const { t, isRtl } = useI18n();

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDeployments = async () => {
    try {
      const data = await api.cloudflare.listDeployments();
      setDeployments(data);
    } catch {
      // ignore if empty
    }
  };

  const handleDeleteDeployment = async (id: string, scriptNameStr: string) => {
    const confirmMsg = t("cloudflare.confirmDelete").replace("{name}", scriptNameStr);
    if (!confirm(confirmMsg)) {
      return;
    }

    setDeletingId(id);
    try {
      await api.cloudflare.deleteDeployment(id);
      await loadDeployments();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || "Failed to delete worker deployment.");
    } finally {
      setDeletingId(null);
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
      setConfigSuccess(t("cloudflare.configSuccess"));
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
        <h1 className="text-3xl font-bold text-white tracking-tight">{t("cloudflare.title")}</h1>
        <p className="text-slate-400 mt-1">
          {t("cloudflare.subtitle")}
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
              <h2 className="text-lg font-semibold text-white">{t("cloudflare.step1Title")}</h2>
              <p className="text-xs text-slate-400">{t("cloudflare.step1Subtitle")}</p>
            </div>
          </div>

          {configSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{configSuccess}</span>
            </div>
          )}

          {configError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{configError}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("cloudflare.accountIdLabel")}
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder={t("cloudflare.accountIdPlaceholder")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("cloudflare.apiTokenLabel")}
              </label>
              <input
                type="password"
                required={!user?.cloudflareConfig}
                dir="ltr"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={
                  user?.cloudflareConfig
                    ? t("cloudflare.apiTokenPlaceholderSaved")
                    : t("cloudflare.apiTokenPlaceholderNew")
                }
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                {t("cloudflare.tokenPermissionHint")}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isSavingConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("cloudflare.saving")}</span>
                </>
              ) : (
                <span>{t("cloudflare.verifySaveBtn")}</span>
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
              <h2 className="text-lg font-semibold text-white">{t("cloudflare.step2Title")}</h2>
              <p className="text-xs text-slate-400">{t("cloudflare.step2Subtitle")}</p>
            </div>
          </div>

          {deploySuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{deploySuccess}</span>
            </div>
          )}

          {deployError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deployError}</span>
            </div>
          )}

          <form onSubmit={handleDeployWorker} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("cloudflare.selectBot")}
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
                  {t("cloudflare.noBotsRegistered")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("cloudflare.defaultChatIdLabel")}
              </label>
              <input
                type="text"
                dir="ltr"
                value={defaultChatId}
                onChange={(e) => setDefaultChatId(e.target.value)}
                placeholder={t("cloudflare.defaultChatIdPlaceholder")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t("cloudflare.scriptNameLabel")}
              </label>
              <input
                type="text"
                dir="ltr"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder={t("cloudflare.scriptNamePlaceholder")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isDeploying || !user?.cloudflareConfig || !user?.telegramBots?.length}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("cloudflare.deploying")}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{t("cloudflare.deployBtn")}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Section 3: Deployed Workers Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">{t("cloudflare.deployedWorkersTitle")}</h2>

        {deployments.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            {t("cloudflare.noWorkers")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-sm ${isRtl ? "text-right" : "text-left"}`}>
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t("cloudflare.thScriptName")}</th>
                  <th className="py-3 px-4">{t("cloudflare.thEndpoint")}</th>
                  <th className="py-3 px-4">{t("cloudflare.thSecretKey")}</th>
                  <th className="py-3 px-4">{t("cloudflare.thStatus")}</th>
                  <th className="py-3 px-4">{t("cloudflare.thDate")}</th>
                  <th className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"}`}>
                    {t("cloudflare.thActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-white" dir="ltr">
                      {d.scriptName}
                    </td>
                    <td className="py-3 px-4" dir="ltr">
                      <a
                        href={d.workerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-mono text-xs"
                      >
                        {d.workerUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4" dir="ltr">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 truncate max-w-[140px]">
                          {d.apiSecretKey}
                        </span>
                        <button
                          onClick={() => copyToClipboard(d.apiSecretKey, d.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title={t("cloudflare.copied")}
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
                    <td className="py-3 px-4 text-xs text-slate-500" dir="ltr">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"}`}>
                      <button
                        onClick={() => handleDeleteDeployment(d.id, d.scriptName)}
                        disabled={deletingId === d.id}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all inline-flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                        title={t("cloudflare.deleteBtn")}
                      >
                        {deletingId === d.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{t("cloudflare.deleteBtn")}</span>
                      </button>
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
