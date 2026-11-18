import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "@node-rs/argon2";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

// OWASP Argon2id recommended parameters
const ARGON2_OPTIONS = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 1,    // 1 compute thread
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
}
