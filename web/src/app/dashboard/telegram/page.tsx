"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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
  const [testText, setTestText] = useState("🔔 Test notification from Cloudflare Notify Dashboard!");
  const [parseMode, setParseMode] = useState("HTML");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const bots = user?.telegramBots || [];

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

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBotSuccess(null);
    setBotError(null);
    setIsAddingBot(true);

    try {
      const res = await api.telegram.addBot({ botToken });
      setBotSuccess(`Bot @${res.botUsername} added and verified!`);
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
        title: channelTitle,
        chatId: channelChatId,
      });
      setChannelSuccess(`Channel '${channelTitle}' verified and linked!`);
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
      await api.telegram.sendTest({
        botId: testBotId,
        chatId: testChatId,
        text: testText,
        parseMode: parseMode || undefined,
      });
      setTestSuccess("Test message successfully delivered to Telegram!");
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
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Telegram Bot</h2>
              <p className="text-xs text-slate-400">Token provided by @BotFather</p>
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
                Telegram Bot Token
              </label>
              <input
                type="password"
                required
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingBot}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isAddingBot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Verify & Register Bot
            </button>
          </form>
        </div>

        {/* Form 2: Link Channel to Bot */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Link Channel / Chat</h2>
              <p className="text-xs text-slate-400">Connect channel where the bot is an admin</p>
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
              {bots.length > 0 ? (
                <select
                  value={selectedBotIdForChannel}
                  onChange={(e) => setSelectedBotIdForChannel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {bots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.botName} (@{b.botUsername})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400 py-1">Please register a bot first.</p>
              )}
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
                placeholder="e.g. Production Alerts"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Target Chat ID
                </label>
                <span className="text-[11px] text-blue-400 font-medium">
                  Public: @name | Private: -100...
                </span>
              </div>
              <input
                type="text"
                required
                value={channelChatId}
                onChange={(e) => setChannelChatId(e.target.value)}
                placeholder="e.g. -1001987654321 or @my_channel"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
              
              {/* Detailed Helper Box for Users */}
              <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <span>How to find your Chat ID:</span>
                </div>
                <div className="space-y-1 pl-1 border-l-2 border-blue-500/40 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-amber-400">Prerequisite:</strong> First add your bot to the channel/group as an <strong>Administrator</strong> with &quot;Post Messages&quot; permission.
                  </p>
                  <p>
                    <strong className="text-slate-200">Option A (Public Channel):</strong> Use the public username with @ (e.g. <code className="text-blue-400">@my_alerts</code>).
                  </p>
                  <p>
                    <strong className="text-slate-200">Option B (Private Channel/Group):</strong> Forward any message from the channel to <code className="text-emerald-400">@RawDataBot</code> or <code className="text-emerald-400">@userinfobot</code> to receive the numeric ID (starts with <code className="text-emerald-400">-100...</code>).
                  </p>
                  <p>
                    <strong className="text-slate-200">Option C (Telegram Web):</strong> Open your channel in <code className="text-slate-300">web.telegram.org</code>. The number in the browser URL (e.g. <code className="text-purple-400">-1001234567890</code>) is your Chat ID.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingChannel || bots.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isAddingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Verify & Link Channel
            </button>
          </form>
        </div>
      </div>

      {/* Direct Test Message Sender UI */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Message Dispatcher</h2>
            <p className="text-xs text-slate-400">Send an instant test notification to any configured channel</p>
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
                onChange={(e) => setParseMode(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              >
                <option value="HTML">HTML</option>
                <option value="MarkdownV2">MarkdownV2</option>
                <option value="">Plain Text</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Message Content
            </label>
            <textarea
              rows={3}
              required
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSendingTest || bots.length === 0}
            className="py-2.5 px-6 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center gap-2"
          >
            {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Dispatch Live Notification
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
