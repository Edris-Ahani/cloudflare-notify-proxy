"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Cloud, Send, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  const hasCloudflare = Boolean(user?.cloudflareConfig);
  const botsCount = user?.telegramBots?.length || 0;
  const workersCount = user?.deployments?.length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-slate-400 mt-1">
          Welcome back! Manage your Cloudflare edge workers, Telegram bots, and notifications.
        </p>
      </div>

      {/* Status Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Cloudflare Account</span>
            <Cloud className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            {hasCloudflare ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Setup Required
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {hasCloudflare
              ? `Account ID: ${user?.cloudflareConfig?.accountId?.slice(0, 8)}...`
              : "Connect your Cloudflare API token to deploy workers"}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Active Workers</span>
            <Cloud className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{workersCount}</div>
          <p className="text-xs text-slate-500 mt-2">
            Isolated workers deployed to your Cloudflare account
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Telegram Bots</span>
            <Send className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{botsCount}</div>
          <p className="text-xs text-slate-500 mt-2">
            Connected bots ready to deliver notifications
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Cloud className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Deploy Cloudflare Worker
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Connect your Cloudflare API token and deploy a private proxy worker in 1-click.
            </p>
          </div>
          <Link
            href="/dashboard/cloudflare"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Manage Workers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Send className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Configure Telegram Bot
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Add your bot token from BotFather and register target channel chat IDs.
            </p>
          </div>
          <Link
            href="/dashboard/telegram"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Manage Bots & Channels <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
