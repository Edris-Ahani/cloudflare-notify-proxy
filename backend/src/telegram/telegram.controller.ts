import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import { AddTelegramBotDto } from "./dto/add-bot.dto";
import { AddChannelDto } from "./dto/add-channel.dto";
import { SendTestMessageDto } from "./dto/send-test.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("telegram")
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @UseGuards(JwtAuthGuard)
  @Post("bot")
  async addBot(
    @Request() req: { user: { userId: string } },
    @Body() dto: AddTelegramBotDto
  ) {
    return this.telegramService.addBot(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("bots")
  async listBots(@Request() req: { user: { userId: string } }) {
    return this.telegramService.listBots(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("channel")
  async addChannel(
    @Request() req: { user: { userId: string } },
    @Body() dto: AddChannelDto
  ) {
    return this.telegramService.addChannel(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("send-test")
  async sendTest(
    @Request() req: { user: { userId: string } },
    @Body() dto: SendTestMessageDto
  ) {
    return this.telegramService.sendTestMessage(req.user.userId, dto);
  }

  @Post("webhook")
  async handleWebhook(@Body() update: any) {
    await this.telegramService.handleIncomingUpdate(update);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("webhook/register")
  async registerWebhook() {
    return this.telegramService.registerSystemBotWebhook();
  }

  @UseGuards(JwtAuthGuard)
  @Get("webhook/info")
  async getWebhookInfo() {
    return this.telegramService.getWebhookInfo();
  }
}
