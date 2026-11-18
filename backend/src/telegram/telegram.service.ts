import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
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
    private readonly crypto: CryptoService
  ) {}

  async addBot(userId: string, dto: AddTelegramBotDto) {
    const cleanToken = dto.botToken.trim();

    // Verify token with Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
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

    // Verify bot access to target chat / channel
    const verifyRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(dto.chatId.trim())}`
    );
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

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
