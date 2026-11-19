// API client helper for communicating with the NestJS backend

// Base API path proxied directly to NestJS backend via Next.js internal rewrites
const API_BASE_URL = "/api";

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const authHeader: Record<string, string> = {};
  const storedToken =
    token !== undefined
      ? token
      : typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (storedToken) {
    authHeader["Authorization"] = `Bearer ${storedToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...headers,
    },
    ...rest,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.message || (Array.isArray(data.message) ? data.message.join(", ") : "API request failed");
    throw new Error(errorMsg);
  }

  return data as T;
}

// Authentication API methods
export const api = {
  auth: {
    register: (body: { phoneNumber: string; password: string }) =>
      fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { phoneNumber: string; password: string }) =>
      fetchApi("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: (token?: string) => fetchApi("/auth/me", { method: "GET", token }),
    telegramOtp: {
      initiate: (body: { phoneNumber: string }): Promise<{
        sessionToken: string;
        botUsername: string;
        deepLink: string;
        expiresAt: string;
      }> =>
        fetchApi("/auth/telegram-otp/initiate", { method: "POST", body: JSON.stringify(body) }),
      status: (token: string): Promise<{
        sessionToken: string;
        phoneNumber: string;
        hasStartedBot: boolean;
        hasOtpSent: boolean;
        isVerified: boolean;
        isExpired: boolean;
        expiresAt: string;
      }> =>
        fetchApi(`/auth/telegram-otp/status/${token}`, { method: "GET" }),
      verify: (body: { sessionToken: string; otpCode?: string; password?: string }) =>
        fetchApi("/auth/telegram-otp/verify", { method: "POST", body: JSON.stringify(body) }),
    },
    forgotPassword: {
      initiate: (body: { phoneNumber: string }): Promise<{
        sessionToken: string;
        hasDirectTelegramSent: boolean;
        botUsername?: string;
        deepLink?: string;
        expiresAt: string;
      }> =>
        fetchApi("/auth/forgot-password/initiate", { method: "POST", body: JSON.stringify(body) }),
      verify: (body: { sessionToken: string; otpCode: string; newPassword: string }) =>
        fetchApi("/auth/forgot-password/verify", { method: "POST", body: JSON.stringify(body) }),
    },
    deleteAccount: (token?: string) =>
      fetchApi("/auth/account", { method: "DELETE", token }),
  },
  cloudflare: {
    saveConfig: (body: { accountId: string; apiToken: string }) =>
      fetchApi("/cloudflare/config", { method: "POST", body: JSON.stringify(body) }),
    getConfig: () => fetchApi("/cloudflare/config", { method: "GET" }),
    deployWorker: (body: { botId: string; defaultChatId?: string; scriptName?: string }) =>
      fetchApi("/cloudflare/deploy-worker", { method: "POST", body: JSON.stringify(body) }),
    listDeployments: () => fetchApi("/cloudflare/deployments", { method: "GET" }),
    deleteDeployment: (id: string) => fetchApi(`/cloudflare/deployments/${id}`, { method: "DELETE" }),
  },
  telegram: {
    addBot: (body: { botToken: string }) =>
      fetchApi("/telegram/bot", { method: "POST", body: JSON.stringify(body) }),
    listBots: () => fetchApi("/telegram/bots", { method: "GET" }),
    addChannel: (body: { botId: string; title: string; chatId: string }) =>
      fetchApi("/telegram/channel", { method: "POST", body: JSON.stringify(body) }),
    sendTest: (body: { botId: string; chatId: string; text: string; parseMode?: string }) =>
      fetchApi("/telegram/send-test", { method: "POST", body: JSON.stringify(body) }),
  },
  templates: {
    create: (body: { title: string; content: string; parseMode?: string }) =>
      fetchApi("/templates", { method: "POST", body: JSON.stringify(body) }),
    list: () => fetchApi("/templates", { method: "GET" }),
    delete: (id: string) => fetchApi(`/templates/${id}`, { method: "DELETE" }),
    dispatch: (
      id: string,
      body: { botId?: string; chatId?: string; variables?: Record<string, string | number> }
    ) =>
      fetchApi(`/templates/${id}/dispatch`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
