"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const { setSessionToken } = useAuth();

  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionTokenState, setSessionTokenState] = useState("");
  const [hasDirectTelegramSent, setHasDirectTelegramSent] = useState(false);
  const [botUsername, setBotUsername] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [hasStartedBot, setHasStartedBot] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step !== "verify" || !sessionTokenState || hasDirectTelegramSent) return;

    const checkStatus = async () => {
      try {
        const res = await api.auth.telegramOtp.status(sessionTokenState);
        if (res.hasStartedBot && !hasStartedBot) {
          setHasStartedBot(true);
        }
      } catch {
        // Silently continue polling
      }
    };

    statusPollingRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, [step, sessionTokenState, hasDirectTelegramSent, hasStartedBot]);

  const handleInitiateReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.forgotPassword.initiate({ phoneNumber });
      setSessionTokenState(res.sessionToken);
      setHasDirectTelegramSent(res.hasDirectTelegramSent);

      if (res.hasDirectTelegramSent) {
        setSuccessMsg("A 5-digit reset code was sent directly to your connected Telegram account!");
      } else {
        setBotUsername(res.botUsername || "AuthPulseBot");
        setDeepLink(res.deepLink || `https://t.me/${res.botUsername || "AuthPulseBot"}`);
      }

      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to initiate password reset. Please check your phone number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!otpCode || otpCode.trim().length < 4) {
      setError("Please enter the 5-digit verification code from Telegram");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.auth.forgotPassword.verify({
        sessionToken: sessionTokenState,
        otpCode: otpCode.trim(),
        newPassword,
      });

      setSuccessMsg("Password reset successfully! Redirecting to dashboard...");
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);

      if (res.accessToken) {
        await setSessionToken(res.accessToken);
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please check your Telegram message.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-sm text-slate-400">
            {step === "phone"
              ? "Enter your phone number to receive a Telegram reset code"
              : "Verify reset code & set your new password"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleInitiateReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09123456789"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Reset Code to Telegram
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {!hasDirectTelegramSent && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mb-4">
                <div className="text-xs text-slate-300 font-medium">
                  Please authorize the Telegram bot to receive your code:
                </div>
                <a
                  href={deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-900/30"
                >
                  <Send className="w-4 h-4" />
                  Open Telegram Bot (@{botUsername}) ➔ Tap Start
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
                <div className="pt-1">
                  {hasStartedBot ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bot connected! Check your Telegram chat for the 5-digit code.
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Waiting for you to tap Start in Telegram...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                5-Digit Telegram Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • •"
                className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !otpCode}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Reset Password & Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtpCode("");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Change Phone Number
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          Remembered your password?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
