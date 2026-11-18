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

@UseGuards(JwtAuthGuard)
@Controller("telegram")
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post("bot")
  async addBot(
    @Request() req: { user: { userId: string } },
    @Body() dto: AddTelegramBotDto
  ) {
    return this.telegramService.addBot(req.user.userId, dto);
  }

  @Get("bots")
  async listBots(@Request() req: { user: { userId: string } }) {
    return this.telegramService.listBots(req.user.userId);
  }

  @Post("channel")
  async addChannel(
    @Request() req: { user: { userId: string } },
    @Body() dto: AddChannelDto
  ) {
    return this.telegramService.addChannel(req.user.userId, dto);
  }

  @Post("send-test")
  async sendTest(
    @Request() req: { user: { userId: string } },
    @Body() dto: SendTestMessageDto
  ) {
    return this.telegramService.sendTestMessage(req.user.userId, dto);
  }
}
