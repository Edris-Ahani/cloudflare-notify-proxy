import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto/crypto.service";
import { AddTelegramBotDto } from "./dto/add-bot.dto";
import { AddChannelDto } from "./dto/add-channel.dto";
import { SendTestMessageDto } from "./dto/send-test.dto";

interface TelegramGetMeResult {
  ok: boolean;
  result?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
  description?: string;
}

function escapeHtml(text: string = ""): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeIranianPhone(rawPhone: string): string {
  let digits = String(rawPhone).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return "0" + digits;
}

function escapeMarkdownV2(text: string = ""): string {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private cachedSystemBotUsername: string | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastUpdateOffset: number = 0;
  private isPollingActive: boolean = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const token = this.getSystemBotToken();
    if (!token) return;

    const pollingConfig = this.configService.get<string>("TELEGRAM_ENABLE_POLLING");
    // Enable polling if explicitly set to true, or by default in development mode
    const shouldPoll =
      pollingConfig === "true" ||
      (pollingConfig !== "false" && process.env.NODE_ENV !== "production");

    if (shouldPoll) {
      // In polling mode, ensure any existing webhook is removed so Telegram sends updates to getUpdates
      await this.deleteWebhook(token).catch(() => null);
      this.startLongPolling();
    } else {
      // In production webhook mode, automatically register the webhook URL (via Cloudflare proxy if configured)
      await this.registerSystemBotWebhook().catch(() => null);
    }
  }

  async registerSystemBotWebhook(): Promise<{ ok: boolean; webhookUrl: string }> {
    const token = this.getSystemBotToken();
    if (!token) return { ok: false, webhookUrl: "" };

    const proxyUrl = this.configService.get<string>("TELEGRAM_PROXY_WORKER_URL");
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");

    let webhookUrl: string;

    if (proxyUrl && proxyUrl.startsWith("https://")) {
      // Route incoming webhooks through the Cloudflare Worker proxy
      const cleanProxy = proxyUrl.replace(/\/$/, "");
      const backendTarget = frontendUrl
        ? `${frontendUrl.replace(/\/$/, "")}/api/telegram/webhook`
        : "";
      webhookUrl = backendTarget
        ? `${cleanProxy}/tg-webhook?target=${encodeURIComponent(backendTarget)}`
        : `${cleanProxy}/tg-webhook`;
    } else if (frontendUrl && frontendUrl.startsWith("https://")) {
      // Direct Webhook to backend domain
      webhookUrl = `${frontendUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    } else {
      return { ok: false, webhookUrl: "" };
    }

    const success = await this.setWebhook(token, webhookUrl);
    return { ok: success, webhookUrl };
  }

  async setWebhook(token: string, webhookUrl: string): Promise<boolean> {
    const { url, headers } = this.getTelegramRequest(`bot${token}/setWebhook`);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: webhookUrl }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    return Boolean(data?.ok);
  }

  async deleteWebhook(token: string): Promise<boolean> {
    const { url, headers } = this.getTelegramRequest(`bot${token}/deleteWebhook`);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ drop_pending_updates: false }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    return Boolean(data?.ok);
  }

  async getWebhookInfo(): Promise<any> {
    const token = this.getSystemBotToken();
    if (!token) return { ok: false, error: "No system bot token configured" };

    const { url, headers } = this.getTelegramRequest(`bot${token}/getWebhookInfo`);
    const res = await fetch(url, { headers }).catch(() => null);
    return res ? res.json().catch(() => ({ ok: false })) : { ok: false };
  }

  onModuleDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  getSystemBotToken(): string {
    return (
      this.configService.get<string>("TELEGRAM_SYSTEM_BOT_TOKEN") ||
      this.configService.get<string>("TELEGRAM_BOT_TOKEN") ||
      ""
    );
  }

  async getSystemBotUsername(): Promise<string> {
    if (this.cachedSystemBotUsername) {
      return this.cachedSystemBotUsername;
    }

    const envUser = this.configService.get<string>("TELEGRAM_SYSTEM_BOT_USERNAME");
    if (envUser) {
      this.cachedSystemBotUsername = envUser.replace(/^@/, "");
      return this.cachedSystemBotUsername;
    }

    const token = this.getSystemBotToken();
    if (!token) return "";

    const { url, headers } = this.getTelegramRequest(`bot${token}/getMe`);
    const res = await fetch(url, { headers });
    const data: TelegramGetMeResult = await res.json().catch(() => ({ ok: false }));

    if (data.ok && data.result?.username) {
      this.cachedSystemBotUsername = data.result.username;
      return this.cachedSystemBotUsername;
    }

    return "";
  }

  async sendSystemBotMessage(
    chatId: string,
    text: string,
    parseMode: string = "HTML",
    replyMarkup?: any
  ) {
    const token = this.getSystemBotToken();
    if (!token) return;

    const { url, headers } = this.getTelegramRequest(`bot${token}/sendMessage`);
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }).catch(() => null);

    if (res && !res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[TelegramService] Failed to send message:", errText);
    }
  }

  async handleIncomingUpdate(update: any): Promise<boolean> {
    if (!update || !update.message) return false;
    const msg = update.message;
    const chatId = String(msg.chat?.id || "");
    const text = String(msg.text || "").trim();
    const contact = msg.contact;

    // 1. Handle /start with session token: /start otp_<sessionToken>
    if (text.startsWith("/start")) {
      const tokenPart = text.replace("/start", "").trim();
      const sessionToken = tokenPart.replace(/^otp_/, "").trim();

      if (sessionToken) {
        const session = await this.prisma.telegramOtpSession.findFirst({
          where: { sessionToken },
          orderBy: { createdAt: "desc" },
        });

        if (session) {
          const otp = Math.floor(10000 + Math.random() * 90000).toString();
          const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

          await this.prisma.telegramOtpSession.update({
            where: { id: session.id },
            data: {
              otpCode: otp,
              telegramChatId: chatId,
              telegramUsername: msg.from?.username || null,
              expiresAt: newExpiresAt,
            },
          });

          const firstName = escapeHtml(msg.from?.first_name || "User");
          const otpMsg = [
            "<b>🔐 Cloudflare Notify Verification</b>",
            "━━━━━━━━━━━━━━━━━━━━━",
            `Hello <b>${firstName}</b> 👋`,
            "",
            "Your 5-digit verification code is:",
            `👉 <code>${otp}</code> 👈`,
            "<i>(Tap the code above to copy it)</i>",
            "",
            "⏱ Valid for 5 minutes.",
            "⚠️ Never share this security code with anyone.",
          ].join("\n");

          await this.sendSystemBotMessage(chatId, otpMsg, "HTML");
          return true;
        }
      }

      // Default greeting if /start has no token
      const welcomeMsg = [
        "<b>👋 Welcome to Cloudflare Notify Bot</b>",
        "━━━━━━━━━━━━━━━━━━━━━",
        "To receive your verification code:",
        "",
        "1️⃣ Tap <b>📱 Share Phone Number</b> below, or",
        "2️⃣ Type your 11-digit mobile number here (e.g., <code>09307634831</code>).",
      ].join("\n");

      await this.sendSystemBotMessage(chatId, welcomeMsg, "HTML", {
        keyboard: [
          [{ text: "📱 Share Phone Number", request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
      return true;
    }

    // 2. Handle Contact Sharing
    if (contact && contact.phone_number) {
      const contactPhone = normalizeIranianPhone(contact.phone_number);

      const session = await this.prisma.telegramOtpSession.findFirst({
        where: { phoneNumber: contactPhone },
        orderBy: { createdAt: "desc" },
      });

      if (session) {
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await this.prisma.telegramOtpSession.update({
          where: { id: session.id },
          data: {
            otpCode: otp,
            isVerified: true,
            telegramChatId: chatId,
            telegramUsername: msg.from?.username || null,
            expiresAt: newExpiresAt,
          },
        });

        const firstName = escapeHtml(msg.from?.first_name || "User");
        const otpMsg = [
          "<b>✅ Phone Number Verified!</b>",
          "━━━━━━━━━━━━━━━━━━━━━",
          `Hello <b>${firstName}</b> 👋`,
          "",
          "Your 5-digit verification code is:",
          `👉 <code>${otp}</code> 👈`,
          "<i>(Tap the code above to copy it)</i>",
          "",
          "You can now return to the website to complete your registration.",
        ].join("\n");

        await this.sendSystemBotMessage(chatId, otpMsg, "HTML");
        return true;
      }
    }

    // 3. Handle Direct Phone Number message (e.g. 09307634831 or +989307634831)
    const rawDigits = text.replace(/\D/g, "");
    if (rawDigits.length >= 10 && rawDigits.length <= 13) {
      const cleanPhone = normalizeIranianPhone(text);

      const session = await this.prisma.telegramOtpSession.findFirst({
        where: { phoneNumber: cleanPhone },
        orderBy: { createdAt: "desc" },
      });

      if (session) {
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await this.prisma.telegramOtpSession.update({
          where: { id: session.id },
          data: {
            otpCode: otp,
            telegramChatId: chatId,
            telegramUsername: msg.from?.username || null,
            expiresAt: newExpiresAt,
          },
        });

        const firstName = escapeHtml(msg.from?.first_name || "User");
        const otpMsg = [
          "<b>🔐 Cloudflare Notify Verification</b>",
          "━━━━━━━━━━━━━━━━━━━━━",
          `Hello <b>${firstName}</b> 👋`,
          "",
          "Your 5-digit verification code is:",
          `👉 <code>${otp}</code> 👈`,
          "<i>(Tap the code above to copy it)</i>",
          "",
          "⏱ Valid for 5 minutes.",
          "⚠️ Never share this security code with anyone.",
        ].join("\n");

        await this.sendSystemBotMessage(chatId, otpMsg, "HTML");
        return true;
      }
    }

    return false;
  }

  private startLongPolling() {
    this.pollingTimer = setInterval(async () => {
      if (this.isPollingActive) return;
      this.isPollingActive = true;
      try {
        const token = this.getSystemBotToken();
        if (!token) return;

        const { url, headers } = this.getTelegramRequest(
          `bot${token}/getUpdates?offset=${this.lastUpdateOffset + 1}&timeout=1`
        );
        const res = await fetch(url, { headers }).catch(() => null);
        if (!res || !res.ok) return;

        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateOffset = Math.max(this.lastUpdateOffset, update.update_id);
            await this.handleIncomingUpdate(update);
          }
        }
      } catch {
        // Silently catch polling errors
      } finally {
        this.isPollingActive = false;
      }
    }, 2500);
  }

  /**
   * Constructs the target URL and headers for Telegram API requests.
   * If TELEGRAM_PROXY_WORKER_URL is configured, all requests are routed
   * through the Cloudflare Worker proxy rather than calling api.telegram.org directly.
   */
  private getTelegramRequest(subPath: string): { url: string; headers: Record<string, string> } {
    const proxyUrl = this.configService.get<string>("TELEGRAM_PROXY_WORKER_URL");
    const proxySecret = this.configService.get<string>("TELEGRAM_PROXY_SECRET");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (proxyUrl) {
      const cleanProxy = proxyUrl.replace(/\/$/, "");
      if (proxySecret) {
        headers["Authorization"] = `Bearer ${proxySecret}`;
      }
      return {
        url: `${cleanProxy}/tg-proxy/${subPath.replace(/^\//, "")}`,
        headers,
      };
    }

    return {
      url: `https://api.telegram.org/${subPath.replace(/^\//, "")}`,
      headers,
    };
  }

  async addBot(userId: string, dto: AddTelegramBotDto) {
    const cleanToken = dto.botToken.trim();

    // Verify token with Telegram Bot API via Cloudflare Worker proxy
    const { url, headers } = this.getTelegramRequest(`bot${cleanToken}/getMe`);
    const response = await fetch(url, { headers });
    const data: TelegramGetMeResult = await response.json().catch(() => ({ ok: false }));

    if (!response.ok || !data.ok || !data.result) {
      throw new BadRequestException(
        `Invalid Telegram Bot Token: ${data.description || "Verification failed"}`
      );
    }

    const { encrypted, iv, tag } = this.crypto.encrypt(cleanToken);

    return this.prisma.telegramBot.create({
      data: {
        userId,
        botName: data.result.first_name,
        botUsername: data.result.username,
        botTokenEncrypted: encrypted,
        botTokenIv: iv,
        botTokenTag: tag,
      },
      select: {
        id: true,
        botName: true,
        botUsername: true,
        createdAt: true,
      },
    });
  }

  async listBots(userId: string) {
    return this.prisma.telegramBot.findMany({
      where: { userId },
      select: {
        id: true,
        botName: true,
        botUsername: true,
        channels: {
          select: {
            id: true,
            title: true,
            chatId: true,
            createdAt: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async addChannel(userId: string, dto: AddChannelDto) {
    const bot = await this.prisma.telegramBot.findFirst({
      where: { id: dto.botId, userId },
    });

    if (!bot) {
      throw new NotFoundException("Telegram bot not found");
    }

    const botToken = this.crypto.decrypt(
      bot.botTokenEncrypted,
      bot.botTokenIv,
      bot.botTokenTag
    );

    // Verify bot access to target chat / channel via proxy worker
    const { url, headers } = this.getTelegramRequest(
      `bot${botToken}/getChat?chat_id=${encodeURIComponent(dto.chatId.trim())}`
    );
    const verifyRes = await fetch(url, { headers });
    const verifyData = await verifyRes.json().catch(() => ({ ok: false }));

    if (!verifyRes.ok || !verifyData.ok) {
      throw new BadRequestException(
        `Bot cannot access chat '${dto.chatId}'. Please make sure the bot is an admin in the channel.`
      );
    }

    return this.prisma.telegramChannel.create({
      data: {
        botId: bot.id,
        title: dto.title.trim(),
        chatId: dto.chatId.trim(),
      },
    });
  }

  async sendTestMessage(userId: string, dto: SendTestMessageDto) {
    const bot = await this.prisma.telegramBot.findFirst({
      where: { id: dto.botId, userId },
    });

    if (!bot) {
      throw new NotFoundException("Telegram bot not found");
    }

    const botToken = this.crypto.decrypt(
      bot.botTokenEncrypted,
      bot.botTokenIv,
      bot.botTokenTag
    );

    const body: Record<string, unknown> = {
      chat_id: dto.chatId,
      text: dto.text,
    };

    if (dto.parseMode) {
      body.parse_mode = dto.parseMode;
    }

    // Check if user has an active deployed Cloudflare Worker
    const userDeployment = await this.prisma.workerDeployment.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    let targetUrl: string;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const MAX_TRIAL_CALLS = 10;
    let usedCustomWorker = false;
    let remainingTrialCalls: number | null = null;

    if (userDeployment) {
      // Route through the user's own deployed Cloudflare Worker (unlimited)
      const cleanUrl = userDeployment.workerUrl.replace(/\/$/, "");
      targetUrl = `${cleanUrl}/tg-proxy/bot${botToken}/sendMessage`;
      headers["Authorization"] = `Bearer ${userDeployment.apiSecretKey}`;
      usedCustomWorker = true;
    } else {
      // Enforce trial limit on platform system proxy (max 10 calls without own worker)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fallbackCallCount: true },
      });

      const currentCount = user?.fallbackCallCount || 0;
      if (currentCount >= MAX_TRIAL_CALLS) {
        throw new BadRequestException(
          `Trial limit reached (${currentCount}/${MAX_TRIAL_CALLS} fallback calls used). You must connect your Cloudflare account and deploy your own dedicated worker to continue sending messages.`
        );
      }

      // Increment fallback usage count
      await this.prisma.user.update({
        where: { id: userId },
        data: { fallbackCallCount: { increment: 1 } },
      });

      remainingTrialCalls = MAX_TRIAL_CALLS - (currentCount + 1);

      // Route through platform-level system proxy
      const sysReq = this.getTelegramRequest(`bot${botToken}/sendMessage`);
      targetUrl = sysReq.url;
      Object.assign(headers, sysReq.headers);
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new BadRequestException(
        `Telegram Error: ${data.description || "Failed to send message"}`
      );
    }

    return {
      ok: true,
      message: "Message sent successfully",
      usedCustomWorker,
      remainingTrialCalls,
      telegramResponse: data,
    };
  }
}
