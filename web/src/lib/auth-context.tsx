"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

export interface User {
  id: string;
  phoneNumber: string;
  createdAt: string;
  cloudflareConfig?: {
    id: string;
    accountId: string;
    status: string;
  } | null;
  telegramBots?: Array<{
    id: string;
    botName: string;
    botUsername: string;
    channels: Array<{ id: string; title: string; chatId: string }>;
  }>;
  deployments?: Array<{
    id: string;
    scriptName: string;
    workerUrl: string;
    apiSecretKey?: string;
    status: string;
    createdAt: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.me(storedToken);
      setUser(data);
      setToken(storedToken);
    } catch {
      localStorage.removeItem("access_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    const res = await api.auth.login({ phoneNumber, password });
    localStorage.setItem("access_token", res.accessToken);
    setToken(res.accessToken);
    await refreshUser();
    router.push("/dashboard");
  };

  const register = async (phoneNumber: string, password: string) => {
    const res = await api.auth.register({ phoneNumber, password });
    localStorage.setItem("access_token", res.accessToken);
    setToken(res.accessToken);
    await refreshUser();
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
