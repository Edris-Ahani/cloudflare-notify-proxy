"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import {
  LayoutDashboard,
  Cloud,
  Send,
  FileText,
  BookOpen,
  LogOut,
  Phone,
  Loader2,
  KeyRound,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const { t, isRtl } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { name: t("nav.overview"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.cloudflare"), href: "/dashboard/cloudflare", icon: Cloud },
    { name: t("nav.telegram"), href: "/dashboard/telegram", icon: Send },
    { name: t("nav.google"), href: "/dashboard/google", icon: KeyRound },
    { name: t("nav.templates"), href: "/dashboard/templates", icon: FileText },
    { name: t("nav.docs"), href: "/dashboard/docs", icon: BookOpen },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 bg-slate-900 border-slate-800 flex flex-col ${isRtl ? "md:border-l" : "md:border-r"}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              CF
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block">
                {t("common.appName")}
              </span>
              <span className="text-xs text-slate-500">{t("common.tagline")}</span>
            </div>
          </Link>
        </div>

        <div className="px-4 pt-3 pb-1">
          <LanguageSwitcher className="w-full justify-center" />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 mb-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate font-mono" dir="ltr">{user.phoneNumber}</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className={`w-4 h-4 flex-shrink-0 ${isRtl ? "rotate-180" : ""}`} />
            <span>{t("common.signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
