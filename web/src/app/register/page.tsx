"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  Send,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function RegisterPage() {
  const { register, setSessionToken } = useAuth();
  const { t, isRtl } = useI18n();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Telegram OTP State
  const [step, setStep] = useState<"form" | "telegram_otp">("form");
  const [sessionToken, setSessionTokenState] = useState("");
  const [botUsername, setBotUsername] = useState("EA_Lab_MSG_Bot");
  const [deepLink, setDeepLink] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [hasStartedBot, setHasStartedBot] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Polling ref for cleanup
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for Telegram bot start status when on OTP step
  useEffect(() => {
    if (step !== "telegram_otp" || !sessionToken) return;

    const checkStatus = async () => {
      try {
        const res = await api.auth.telegramOtp.status(sessionToken);
        if (res.hasStartedBot && !hasStartedBot) {
          setHasStartedBot(true);
        }
        if (res.isVerified) {
          // If auto-verified via contact sharing, complete registration immediately
          handleCompleteVerification();
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
  }, [step, sessionToken, hasStartedBot]);

  const handleInitiateTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.auth.telegramOtp.initiate({ phoneNumber });
      setSessionTokenState(res.sessionToken);
      setBotUsername(res.botUsername);
      setDeepLink(res.deepLink);
      setHasStartedBot(false);
      setStep("telegram_otp");
    } catch (err: any) {
      setError(err.message || "Failed to initiate Telegram verification. Please check your number.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsVerifyingOtp(true);

    try {
      const res = await api.auth.telegramOtp.verify({
        sessionToken,
        otpCode: otpCode.trim() || undefined,
        password,
      });

      setOtpSuccess("Phone number verified! Redirecting to dashboard...");
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);

      if (res.accessToken) {
        await setSessionToken(res.accessToken);
      }
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please check your Telegram message.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDirectPasswordRegister = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    setIsLoading(true);
    try {
      await register(phoneNumber, password);
    } catch (err: any) {
      setError(err.message || "Direct registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex justify-end mb-3">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {step === "form" ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{t("auth.createAccount")}</h1>
              <p className="text-sm text-slate-400">
                {t("auth.signUpSubtitle")}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitiateTelegram} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {t("auth.phoneLabel")}
                </label>
                <div className="relative">
                  <Phone className={`w-5 h-5 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09123456789"
                    className={`w-full py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Format: 09xxxxxxxxx or +989xxxxxxxxx</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {t("auth.passwordLabel")}
                </label>
                <div className="relative">
                  <Lock className={`w-5 h-5 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className={`w-full py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {t("auth.confirmPasswordLabel")}
                </label>
                <div className="relative">
                  <Lock className={`w-5 h-5 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={`w-full py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                    }`}
                  />
                </div>
              </div>

              {/* Telegram Primary Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("auth.verifyWithTelegram")}
                  </>
                )}
              </button>

              {/* Direct fallback link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleDirectPasswordRegister}
                  disabled={isLoading}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {t("auth.registerDirectly")}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Step 2: Telegram OTP Verification */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{t("auth.verifyViaTelegram")}</h2>
              <p className="text-xs text-slate-400">
                {t("auth.targetNumber")}: <span className="text-white font-mono">{phoneNumber}</span>
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* Instruction Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px]">
                  1
                </span>
                {t("auth.step1Title")}
              </div>

              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-900/30"
              >
                <Send className="w-4 h-4" />
                {t("auth.openBot")} (@{botUsername}) ➔ {t("auth.tapStart")}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              {/* Real-time status */}
              <div className="pt-1">
                {hasStartedBot ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("auth.botConnected")}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("auth.waitingBot")}
                  </div>
                )}
              </div>
            </div>

            {/* OTP Code Form */}
            <form onSubmit={handleCompleteVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("auth.step2Title")}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  dir="ltr"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • •"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || !otpCode}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t("auth.confirmRegistration")}
                    <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t("auth.changePhone")}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          {t("common.haveAccount")}{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
