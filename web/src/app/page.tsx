"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import Link from "next/link";
import { Send, Zap, Shield, Cloud } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { t, isRtl } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Send className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            {t("common.appName", "CF Notify")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            {t("common.signIn", "Sign In")}
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3.5 py-1.5 shadow-md shadow-blue-600/20 transition-all"
          >
            {t("common.signUp", "Sign Up")}
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" /> {t("home.badge")}
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
          {t("home.title")}
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mb-10 leading-relaxed">
          {t("home.subtitle")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> {t("home.getStarted")}
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all"
          >
            {t("common.signIn")}
          </Link>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl ${isRtl ? "text-right" : "text-left"}`}>
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t("home.feature1Title")}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("home.feature1Desc")}
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Cloud className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t("home.feature2Title")}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("home.feature2Desc")}
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Send className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t("home.feature3Title")}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("home.feature3Desc")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
