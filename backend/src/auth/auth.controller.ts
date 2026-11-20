import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  InitiateTelegramOtpDto,
  VerifyTelegramOtpDto,
  InitiateForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/telegram-otp.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private resolveLang(dtoLang?: string, xLang?: string, acceptLang?: string): string {
    if (dtoLang) return dtoLang.toLowerCase().startsWith("fa") ? "fa" : "en";
    if (xLang) return xLang.toLowerCase().startsWith("fa") ? "fa" : "en";
    if (acceptLang) return acceptLang.toLowerCase().startsWith("fa") ? "fa" : "en";
    return "en";
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("telegram-otp/initiate")
  @HttpCode(HttpStatus.OK)
  async initiateTelegramOtp(
    @Body() dto: InitiateTelegramOtpDto,
    @Headers("x-lang") xLang?: string,
    @Headers("accept-language") acceptLang?: string
  ) {
    const lang = this.resolveLang(dto.lang, xLang, acceptLang);
    return this.authService.initiateTelegramOtp(dto.phoneNumber, lang);
  }

  @Get("telegram-otp/status/:token")
  async getTelegramOtpStatus(@Param("token") token: string) {
    return this.authService.getTelegramOtpStatus(token);
  }

  @Post("telegram-otp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyTelegramOtp(@Body() dto: VerifyTelegramOtpDto) {
    return this.authService.verifyTelegramOtp(dto);
  }

  @Post("forgot-password/initiate")
  @HttpCode(HttpStatus.OK)
  async initiateForgotPassword(
    @Body() dto: InitiateForgotPasswordDto,
    @Headers("x-lang") xLang?: string,
    @Headers("accept-language") acceptLang?: string
  ) {
    const lang = this.resolveLang(dto.lang, xLang, acceptLang);
    return this.authService.initiateForgotPassword(dto, lang);
  }

  @Post("forgot-password/verify")
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Headers("x-lang") xLang?: string,
    @Headers("accept-language") acceptLang?: string
  ) {
    const lang = this.resolveLang(dto.lang, xLang, acceptLang);
    return this.authService.resetPassword(dto, lang);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Request() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("account")
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Request() req: { user: { userId: string } },
    @Headers("x-lang") xLang?: string,
    @Headers("accept-language") acceptLang?: string
  ) {
    const lang = this.resolveLang(undefined, xLang, acceptLang);
    return this.authService.deleteAccount(req.user.userId, lang);
  }
}
