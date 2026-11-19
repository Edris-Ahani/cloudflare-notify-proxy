import {
  Body,
  Controller,
  Get,
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
import { InitiateTelegramOtpDto, VerifyTelegramOtpDto } from "./dto/telegram-otp.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async initiateTelegramOtp(@Body() dto: InitiateTelegramOtpDto) {
    return this.authService.initiateTelegramOtp(dto.phoneNumber);
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

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Request() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }
}
