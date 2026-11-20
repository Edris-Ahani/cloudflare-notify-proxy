import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "@node-rs/argon2";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramService } from "../telegram/telegram.service";
import {
  getPasswordResetMessage,
  getPasswordChangedMessage,
  getAccountDeletedMessage,
} from "../telegram/telegram-messages";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  VerifyTelegramOtpDto,
  InitiateForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/telegram-otp.dto";

// OWASP Argon2id recommended parameters
const ARGON2_OPTIONS = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 1,    // 1 compute thread
};

function normalizePhoneNumber(rawPhone: string): string {
  let digits = String(rawPhone).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return "0" + digits;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly telegramService: TelegramService
  ) {}

  async register(dto: RegisterDto) {
    const cleanPhone = dto.phoneNumber.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (existingUser) {
      throw new ConflictException("A user with this phone number already exists");
    }

    // Hash password with Argon2id
    const passwordHash = await hash(dto.password, ARGON2_OPTIONS);

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: cleanPhone,
        passwordHash,
      },
    });

    const token = this.generateToken(user.id, user.phoneNumber);

    return {
      message: "Registration successful",
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const cleanPhone = dto.phoneNumber.trim();

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    const isValidPassword = await verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    const token = this.generateToken(user.id, user.phoneNumber);

    return {
      message: "Login successful",
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        fallbackCallCount: true,
        createdAt: true,
        cloudflareConfig: {
          select: {
            id: true,
            accountId: true,
            status: true,
            createdAt: true,
          },
        },
        telegramBots: {
          select: {
            id: true,
            botName: true,
            botUsername: true,
            channels: true,
            createdAt: true,
          },
        },
        deployments: {
          select: {
            id: true,
            scriptName: true,
            workerUrl: true,
            apiSecretKey: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  private generateToken(userId: string, phoneNumber: string): string {
    return this.jwtService.sign({
      sub: userId,
      phoneNumber,
    });
  }

  async initiateTelegramOtp(phoneNumber: string, lang: string = "en") {
    let cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (cleanPhone.startsWith("+98")) cleanPhone = "0" + cleanPhone.slice(3);
    if (cleanPhone.startsWith("0098")) cleanPhone = "0" + cleanPhone.slice(4);

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (existingUser) {
      throw new ConflictException("An account with this phone number already exists. Please log in.");
    }

    const sessionToken = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.telegramOtpSession.create({
      data: {
        phoneNumber: cleanPhone,
        sessionToken,
        expiresAt,
      },
    });

    const botUsername = await this.telegramService.getSystemBotUsername();
    const deepLink = `https://t.me/${botUsername}?start=otp_${sessionToken}_${lang}`;

    return {
      sessionToken,
      botUsername,
      deepLink,
      expiresAt,
    };
  }

  async getTelegramOtpStatus(sessionToken: string) {
    const session = await this.prisma.telegramOtpSession.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      throw new NotFoundException("Verification session not found");
    }

    const isExpired = session.expiresAt < new Date();

    return {
      sessionToken: session.sessionToken,
      phoneNumber: session.phoneNumber,
      hasStartedBot: Boolean(session.telegramChatId),
      hasOtpSent: Boolean(session.otpCode),
      isVerified: session.isVerified,
      isExpired,
      expiresAt: session.expiresAt,
    };
  }

  async verifyTelegramOtp(dto: VerifyTelegramOtpDto) {
    const session = await this.prisma.telegramOtpSession.findUnique({
      where: { sessionToken: dto.sessionToken },
    });

    if (!session) {
      throw new BadRequestException("Invalid or non-existent verification session");
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException("Verification session has expired. Please request a new code.");
    }

    // Verify OTP code if not already verified via contact sharing
    if (!session.isVerified) {
      if (!session.otpCode) {
        throw new BadRequestException(
          "No verification code generated yet. Please open the Telegram bot and click Start first."
        );
      }

      if (!dto.otpCode || dto.otpCode.trim() !== session.otpCode.trim()) {
        throw new BadRequestException("Invalid verification code. Please check your Telegram message.");
      }
    }

    // Mark session as verified
    await this.prisma.telegramOtpSession.update({
      where: { id: session.id },
      data: { isVerified: true },
    });

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: session.phoneNumber },
    });

    if (!user) {
      if (!dto.password) {
        throw new BadRequestException("Password is required to create a new account");
      }

      const passwordHash = await hash(dto.password, ARGON2_OPTIONS);
      user = await this.prisma.user.create({
        data: {
          phoneNumber: session.phoneNumber,
          passwordHash,
          telegramChatId: session.telegramChatId,
        },
      });
    } else if (session.telegramChatId && !user.telegramChatId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: session.telegramChatId },
      });
    }

    const token = this.generateToken(user.id, user.phoneNumber);

    return {
      message: "Registration and verification successful",
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        telegramChatId: user.telegramChatId,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async initiateForgotPassword(dto: InitiateForgotPasswordDto, lang: string = "en") {
    const cleanPhone = normalizePhoneNumber(dto.phoneNumber);

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      throw new NotFoundException("No account registered with this phone number");
    }

    const sessionToken = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // If user has a linked Telegram chat, send OTP code directly to Telegram
    if (user.telegramChatId) {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      await this.prisma.telegramOtpSession.create({
        data: {
          phoneNumber: cleanPhone,
          sessionToken,
          otpCode: otp,
          telegramChatId: user.telegramChatId,
          expiresAt,
        },
      });

      const resetMsg = getPasswordResetMessage(otp, lang);
      await this.telegramService.sendSystemBotMessage(user.telegramChatId, resetMsg, "HTML");

      return {
        sessionToken,
        hasDirectTelegramSent: true,
        expiresAt,
      };
    }

    // Fallback: If user has no telegramChatId linked yet, initiate deep link authorization
    await this.prisma.telegramOtpSession.create({
      data: {
        phoneNumber: cleanPhone,
        sessionToken,
        expiresAt,
      },
    });

    const botUsername = await this.telegramService.getSystemBotUsername();
    const deepLink = `https://t.me/${botUsername}?start=otp_${sessionToken}_${lang}`;

    return {
      sessionToken,
      hasDirectTelegramSent: false,
      botUsername,
      deepLink,
      expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto, lang: string = "en") {
    const session = await this.prisma.telegramOtpSession.findUnique({
      where: { sessionToken: dto.sessionToken },
    });

    if (!session) {
      throw new BadRequestException("Invalid or non-existent password reset session");
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException("Password reset code has expired. Please request a new one.");
    }

    if (!session.otpCode || dto.otpCode.trim() !== session.otpCode.trim()) {
      throw new BadRequestException("Invalid verification code. Please check your Telegram message.");
    }

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: session.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException("No account found for this phone number");
    }

    const passwordHash = await hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        telegramChatId: session.telegramChatId || user.telegramChatId,
      },
    });

    // Clean up session
    await this.prisma.telegramOtpSession.delete({
      where: { id: session.id },
    }).catch(() => null);

    // Notify user on Telegram
    const targetChatId = user.telegramChatId || session.telegramChatId;
    if (targetChatId) {
      const changedMsg = getPasswordChangedMessage(lang);
      await this.telegramService.sendSystemBotMessage(targetChatId, changedMsg, "HTML");
    }

    const token = this.generateToken(user.id, user.phoneNumber);

    return {
      message: "Password reset successful",
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        telegramChatId: user.telegramChatId,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async deleteAccount(userId: string, lang: string = "en") {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User account not found");
    }

    // Clean up OTP sessions for this user's phone number
    await this.prisma.telegramOtpSession.deleteMany({
      where: { phoneNumber: user.phoneNumber },
    });

    // Notify user on Telegram before removing account
    if (user.telegramChatId) {
      const deletedMsg = getAccountDeletedMessage(lang);
      await this.telegramService.sendSystemBotMessage(user.telegramChatId, deletedMsg, "HTML");
    }

    // Cascade delete user and all related data (bots, channels, templates, deployments, configs)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: "Account and all associated data permanently deleted" };
  }
}
