"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Send, Zap, Shield, Cloud } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
        <Zap className="w-4 h-4" /> Next-Gen Cloudflare & Telegram Notification Hub
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
        Automate Telegram Notifications with Cloudflare Workers
      </h1>

      <p className="text-slate-400 text-lg max-w-2xl mb-10">
        Deploy isolated edge workers to your personal Cloudflare account in 1-click. Securely dispatch alerts, webhook triggers, and channel broadcasts with Argon2 security.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Get Started Free
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-all"
        >
          Sign In
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-left">
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <Shield className="w-8 h-8 text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Argon2id & AES-256</h3>
          <p className="text-sm text-slate-400">
            Top-tier password security with OWASP Argon2id, and hardware-grade AES-256-GCM encryption for all sensitive tokens.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <Cloud className="w-8 h-8 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">1-Click Cloudflare Deploy</h3>
          <p className="text-sm text-slate-400">
            Automated provisioning directly into your own Cloudflare account using official Cloudflare REST APIs.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <Send className="w-8 h-8 text-emerald-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Telegram Bot & Channels</h3>
          <p className="text-sm text-slate-400">
            Effortlessly broadcast markdown reports and structured crash logs to your channels via custom webhooks.
          </p>
        </div>
      </div>
    </main>
  );
}
