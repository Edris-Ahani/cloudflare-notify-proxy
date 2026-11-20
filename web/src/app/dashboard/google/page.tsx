"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Radio,
  BookOpen,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export default function GoogleDashboardPage() {
  const { user, refreshUser } = useAuth();
  const { t, isRtl } = useI18n();

  // Config Form State
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUris, setRedirectUris] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Live Auth Tester State
  const [testRedirectUri, setTestRedirectUri] = useState("");
  const [generatedAuthUrl, setGeneratedAuthUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [authCodeInput, setAuthCodeInput] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeResult, setExchangeResult] = useState<any | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  // Copied State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load existing config on mount
  useEffect(() => {
    if (user?.googleConfig) {
      setClientId(user.googleConfig.clientId);
      if (user.googleConfig.authorizedRedirectUris?.length) {
        const uris = user.googleConfig.authorizedRedirectUris.join(", ");
        setRedirectUris(uris);
        setTestRedirectUri(user.googleConfig.authorizedRedirectUris[0]);
      }
    } else {
      api.google.getConfig().then((cfg) => {
        if (cfg) {
          setClientId(cfg.clientId);
          if (cfg.authorizedRedirectUris?.length) {
            setRedirectUris(cfg.authorizedRedirectUris.join(", "));
            setTestRedirectUri(cfg.authorizedRedirectUris[0]);
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  const deployments = user?.deployments || [];
  const activeDeployment = deployments[0];
  const workerEndpoint = activeDeployment?.workerUrl
    ? activeDeployment.workerUrl.replace(/\/$/, "")
    : "https://your-worker-subdomain.workers.dev";
  const apiKey = activeDeployment?.apiSecretKey || "YOUR_WORKER_API_SECRET_KEY";

  const isConfigured = Boolean(clientId || user?.googleConfig);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setConfigError("Both Client ID and Client Secret are required.");
      return;
    }

    setIsSaving(true);
    setConfigError(null);
    setConfigSuccess(null);

    try {
      const urisArray = redirectUris
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      await api.google.saveConfig({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        authorizedRedirectUris: urisArray,
      });

      setConfigSuccess(t("google.successSaved"));
      setClientSecret(""); // Clear secret from form after saving
      if (urisArray.length && !testRedirectUri) {
        setTestRedirectUri(urisArray[0]);
      }
      await refreshUser();
    } catch (err: any) {
      setConfigError(err.message || "Failed to save Google credentials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!window.confirm(t("google.confirmDelete"))) return;

    setIsDeleting(true);
    setConfigError(null);
    try {
      await api.google.deleteConfig();
      setClientId("");
      setClientSecret("");
      setRedirectUris("");
      setConfigSuccess(t("google.successDeleted"));
      await refreshUser();
    } catch (err: any) {
      setConfigError(err.message || "Failed to remove Google credentials");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateAuthUrl = async () => {
    setIsGeneratingUrl(true);
    setExchangeError(null);
    try {
      const targetUri = testRedirectUri.trim() || (typeof window !== "undefined" ? window.location.origin : "");
      const res = await api.google.getAuthUrl({ redirectUri: targetUri });
      setGeneratedAuthUrl(res.url);
    } catch (err: any) {
      setExchangeError(err.message || "Failed to generate Google login URL");
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  const handleExchangeToken = async () => {
    if (!authCodeInput.trim()) {
      setExchangeError("Please paste an authorization code.");
      return;
    }

    setIsExchanging(true);
    setExchangeError(null);
    setExchangeResult(null);

    try {
      const res = await api.google.exchangeToken({
        code: authCodeInput.trim(),
        redirectUri: testRedirectUri.trim(),
      });
      setExchangeResult(res);
    } catch (err: any) {
      setExchangeError(err.message || "Token exchange failed");
    } finally {
      setIsExchanging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">
            <KeyRound className="w-5 h-5" />
          </div>
          {t("google.pageTitle")}
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
          {t("google.pageSubtitle")}
        </p>
      </div>

      {/* Grid: Credentials Form & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t("google.statusCardTitle")}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConfigured
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConfigured ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              {isConfigured ? t("google.statusActive") : t("google.statusNotConfigured")}
            </span>
          </div>

          {configSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{configSuccess}</span>
            </div>
          )}

          {configError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{configError}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t("google.clientIdLabel")}
              </label>
              <input
                type="text"
                dir={isRtl ? (clientId ? "ltr" : "rtl") : "ltr"}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder={t("google.clientIdPlaceholder")}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isRtl ? (clientId ? "text-left" : "text-right") : "text-left"
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t("google.clientSecretLabel")}
              </label>
              <input
                type="password"
                dir={isRtl ? (clientSecret ? "ltr" : "rtl") : "ltr"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={
                  isConfigured
                    ? "••••••••••••••••••••••••••••••••"
                    : t("google.clientSecretPlaceholder")
                }
                className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isRtl ? (clientSecret ? "text-left" : "text-right") : "text-left"
                }`}
                required={!isConfigured}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t("google.redirectUrisLabel")}
              </label>
              <input
                type="text"
                dir={isRtl ? (redirectUris ? "ltr" : "rtl") : "ltr"}
                value={redirectUris}
                onChange={(e) => setRedirectUris(e.target.value)}
                placeholder={t("google.redirectUrisPlaceholder")}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isRtl ? (redirectUris ? "text-left" : "text-right") : "text-left"
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {t("google.redirectUrisHint")}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("google.saving")}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t("google.saveCredentials")}</span>
                  </>
                )}
              </button>

              {isConfigured && (
                <button
                  type="button"
                  onClick={handleDeleteConfig}
                  disabled={isDeleting}
                  className="px-3.5 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("google.removeCredentials")}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Worker Endpoints for Apps (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Radio className="w-4 h-4 text-amber-400" />
            <span>{t("google.workerIntegrationTitle")}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t("google.workerIntegrationDesc")}
          </p>

          <div className="space-y-3 text-xs">
            {/* Endpoint 1: Auth URL */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-medium text-slate-300">
                {t("google.endpointUrlLabel")}
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                <span className="truncate">GET {workerEndpoint}/auth/google/url</span>
                <button
                  onClick={() =>
                    copyToClipboard(`GET ${workerEndpoint}/auth/google/url?redirect_uri=YOUR_CALLBACK`, "ep1")
                  }
                  className="shrink-0 text-slate-400 hover:text-white"
                >
                  {copiedKey === "ep1" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Endpoint 2: Token Exchange */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-medium text-slate-300">
                {t("google.endpointTokenLabel")}
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-blue-400 overflow-x-auto">
                <span className="truncate">POST {workerEndpoint}/auth/google/token</span>
                <button
                  onClick={() =>
                    copyToClipboard(`POST ${workerEndpoint}/auth/google/token`, "ep2")
                  }
                  className="shrink-0 text-slate-400 hover:text-white"
                >
                  {copiedKey === "ep2" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Endpoint 3: Reverse Proxy */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-medium text-slate-300">
                {t("google.endpointProxyLabel")}
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-amber-400 overflow-x-auto">
                <span className="truncate">ANY {workerEndpoint}/google-proxy/*</span>
                <button
                  onClick={() =>
                    copyToClipboard(`${workerEndpoint}/google-proxy/oauth2/v3/userinfo`, "ep3")
                  }
                  className="shrink-0 text-slate-400 hover:text-white"
                >
                  {copiedKey === "ep3" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Auth Tester Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {t("google.testSuiteTitle")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("google.testSuiteSubtitle")}
            </p>
          </div>
        </div>

        {exchangeError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{exchangeError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Step 1: Generate Auth URL */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-medium text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              {t("google.getAuthUrlButton")}
            </span>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                {t("google.redirectUriForExchange")}
              </label>
              <input
                type="text"
                value={testRedirectUri}
                onChange={(e) => setTestRedirectUri(e.target.value)}
                placeholder="https://your-domain.com/callback"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateAuthUrl}
              disabled={isGeneratingUrl}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isGeneratingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{t("google.getAuthUrlButton")}</span>
            </button>

            {generatedAuthUrl && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 break-all max-h-24 overflow-y-auto">
                  {generatedAuthUrl}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={generatedAuthUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 bg-red-600/90 hover:bg-red-500 text-white rounded text-[11px] font-medium text-center inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{t("google.openGoogleLogin")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedAuthUrl, "authUrl")}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === "authUrl" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{t("google.copyAuthUrl")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Exchange Authorization Code */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-medium text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              {t("google.exchangeTokenTitle")}
            </span>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                {t("google.exchangeCodePlaceholder")}
              </label>
              <textarea
                rows={2}
                value={authCodeInput}
                onChange={(e) => setAuthCodeInput(e.target.value)}
                placeholder="4/0AWtgzh..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleExchangeToken}
              disabled={isExchanging}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isExchanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{t("google.exchangeButton")}</span>
            </button>

            {exchangeResult && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-emerald-400">
                  {t("google.userProfileResult")}
                </span>
                <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 max-h-36 overflow-y-auto">
                  {JSON.stringify(exchangeResult.user || exchangeResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-white">
            {t("google.guideTitle")}
          </h2>
        </div>

        <ol className={`list-decimal space-y-2 text-xs text-slate-300 ${isRtl ? "pr-5" : "pl-5"}`}>
          <li>{t("google.guideStep1")}</li>
          <li>{t("google.guideStep2")}</li>
          <li>{t("google.guideStep3")}</li>
          <li>{t("google.guideStep4")}</li>
          <li>{t("google.guideStep5")}</li>
        </ol>
      </div>
    </div>
  );
}
