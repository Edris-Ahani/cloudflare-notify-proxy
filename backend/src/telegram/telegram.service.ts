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

    // Forward test message through Cloudflare Worker proxy
    const { url, headers } = this.getTelegramRequest(`bot${botToken}/sendMessage`);
    const res = await fetch(url, {
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
      telegramResponse: data,
    };
  }
}
