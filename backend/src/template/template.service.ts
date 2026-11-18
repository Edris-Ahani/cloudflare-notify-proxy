import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramService } from "../telegram/telegram.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { DispatchTemplateDto } from "./dto/dispatch-template.dto";

@Injectable()
export class TemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService
  ) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.messageTemplate.create({
      data: {
        userId,
        title: dto.title.trim(),
        content: dto.content,
        parseMode: dto.parseMode || "MarkdownV2",
      },
    });
  }

  async list(userId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(userId: string, templateId: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    return this.prisma.messageTemplate.delete({
      where: { id: templateId },
    });
  }

  render(template: string, variables: Record<string, string | number>): string {
    let output = template;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      output = output.replace(regex, String(val));
    }
    return output;
  }

  async dispatch(userId: string, templateId: string, dto: DispatchTemplateDto) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    const renderedText = this.render(template.content, dto.variables || {});

    let botId = dto.botId;
    if (!botId) {
      const defaultBot = await this.prisma.telegramBot.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (!defaultBot) {
        throw new BadRequestException("No Telegram bot configured. Please register a bot first.");
      }
      botId = defaultBot.id;
    }

    let chatId = dto.chatId;
    if (!chatId) {
      const defaultChannel = await this.prisma.telegramChannel.findFirst({
        where: { bot: { userId } },
        orderBy: { createdAt: "desc" },
      });
      if (!defaultChannel) {
        throw new BadRequestException("No Telegram chat/channel configured.");
      }
      chatId = defaultChannel.chatId;
    }

    return this.telegramService.sendTestMessage(userId, {
      botId,
      chatId,
      text: renderedText,
      parseMode: template.parseMode,
    });
  }
}
