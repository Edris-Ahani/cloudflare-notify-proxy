"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  Cloud,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { user, deleteAccount } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const hasCloudflare = Boolean(user?.cloudflareConfig);
  const botsCount = user?.telegramBots?.length || 0;
  const workersCount = user?.deployments?.length || 0;

  const handleDeleteAccount = async () => {
    if (confirmInput !== "DELETE") return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

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

      {/* Danger Zone: Account Deletion */}
      <div className="p-6 rounded-xl bg-red-950/20 border border-red-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone: Delete Account
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Permanently delete your user account, stored Cloudflare API credentials, all
              registered Telegram bots, channels, message templates, and deployment records. This
              action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <Trash2 className="w-4 h-4" /> Delete Account & Data
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Account Permanently</h3>
                <p className="text-xs text-slate-400">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you absolutely sure? All your data including Cloudflare configurations, Telegram
              bots, message templates, and authentication sessions will be immediately and
              permanently purged.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1.5">
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmInput("");
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
