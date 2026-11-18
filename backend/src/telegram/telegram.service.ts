import {
  Injectable,
  BadRequestException,
  NotFoundException,
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

@Injectable()
export class TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly configService: ConfigService
  ) {}

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
