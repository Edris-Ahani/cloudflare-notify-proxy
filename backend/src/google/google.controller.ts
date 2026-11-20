import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { GoogleService } from "./google.service";
import { SaveGoogleConfigDto } from "./dto/save-google-config.dto";
import { ExchangeGoogleTokenDto } from "./dto/exchange-token.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("google")
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post("config")
  @HttpCode(HttpStatus.OK)
  async saveConfig(
    @Request() req: { user: { userId: string } },
    @Body() dto: SaveGoogleConfigDto
  ) {
    return this.googleService.saveConfig(req.user.userId, dto);
  }

  @Get("config")
  async getConfig(@Request() req: { user: { userId: string } }) {
    return this.googleService.getConfig(req.user.userId);
  }

  @Delete("config")
  @HttpCode(HttpStatus.OK)
  async deleteConfig(@Request() req: { user: { userId: string } }) {
    return this.googleService.deleteConfig(req.user.userId);
  }

  @Get("auth-url")
  async getAuthUrl(
    @Request() req: { user: { userId: string } },
    @Query("redirectUri") redirectUri?: string,
    @Query("state") state?: string,
    @Query("scope") scope?: string
  ) {
    return this.googleService.generateAuthUrl(
      req.user.userId,
      redirectUri,
      state,
      scope
    );
  }

  @Post("exchange-token")
  @HttpCode(HttpStatus.OK)
  async exchangeToken(
    @Request() req: { user: { userId: string } },
    @Body() dto: ExchangeGoogleTokenDto
  ) {
    return this.googleService.exchangeToken(req.user.userId, dto);
  }
}
