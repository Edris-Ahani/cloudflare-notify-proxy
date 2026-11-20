import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto/crypto.service";
import { SaveGoogleConfigDto } from "./dto/save-google-config.dto";
import { ExchangeGoogleTokenDto } from "./dto/exchange-token.dto";

@Injectable()
export class GoogleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService
  ) {}

  async saveConfig(userId: string, dto: SaveGoogleConfigDto) {
    const encryptedSecret = this.crypto.encrypt(dto.clientSecret.trim());

    const config = await this.prisma.googleAuthConfig.upsert({
      where: { userId },
      create: {
        userId,
        clientId: dto.clientId.trim(),
        clientSecretEncrypted: encryptedSecret.encrypted,
        clientSecretIv: encryptedSecret.iv,
        clientSecretTag: encryptedSecret.tag,
        authorizedRedirectUris: dto.authorizedRedirectUris || [],
        status: "ACTIVE",
      },
      update: {
        clientId: dto.clientId.trim(),
        clientSecretEncrypted: encryptedSecret.encrypted,
        clientSecretIv: encryptedSecret.iv,
        clientSecretTag: encryptedSecret.tag,
        authorizedRedirectUris: dto.authorizedRedirectUris || [],
        status: "ACTIVE",
      },
    });

    return {
      message: "Google OAuth credentials saved successfully",
      config: {
        id: config.id,
        clientId: config.clientId,
        authorizedRedirectUris: config.authorizedRedirectUris,
        status: config.status,
        createdAt: config.createdAt,
      },
    };
  }

  async getConfig(userId: string) {
    const config = await this.prisma.googleAuthConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      clientId: config.clientId,
      clientSecretMasked: "••••••••••••••••",
      authorizedRedirectUris: config.authorizedRedirectUris,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  async deleteConfig(userId: string) {
    const config = await this.prisma.googleAuthConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException("Google OAuth configuration not found");
    }

    await this.prisma.googleAuthConfig.delete({
      where: { userId },
    });

    return { message: "Google OAuth credentials removed successfully" };
  }

  async generateAuthUrl(
    userId: string,
    redirectUri?: string,
    state?: string,
    scope?: string
  ) {
    const config = await this.prisma.googleAuthConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException("Google OAuth configuration not found. Please configure your Client ID first.");
    }

    const targetRedirectUri =
      redirectUri || (config.authorizedRedirectUris.length > 0 ? config.authorizedRedirectUris[0] : "");

    if (!targetRedirectUri) {
      throw new BadRequestException("redirectUri is required to generate Google Authorization URL");
    }

    const defaultScope = "openid email profile";
    const targetScope = scope || defaultScope;

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: targetRedirectUri,
      response_type: "code",
      scope: targetScope,
      access_type: "offline",
      prompt: "consent",
    });

    if (state) {
      params.append("state", state);
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      ok: true,
      url,
      clientId: config.clientId,
      redirectUri: targetRedirectUri,
      scope: targetScope,
    };
  }

  async exchangeToken(userId: string, dto: ExchangeGoogleTokenDto) {
    // 1. Resolve client credentials from database or incoming DTO
    let clientId = dto.clientId;
    let clientSecret = dto.clientSecret;

    if (!clientId || !clientSecret) {
      const config = await this.prisma.googleAuthConfig.findUnique({
        where: { userId },
      });

      if (!config) {
        throw new NotFoundException(
          "Google OAuth configuration not found. Please provide credentials or save them in settings."
        );
      }

      clientId = config.clientId;
      clientSecret = this.crypto.decrypt(
        config.clientSecretEncrypted,
        config.clientSecretIv,
        config.clientSecretTag
      );
    }

    // 2. Check if user has an active deployed worker to route through
    const userDeployment = await this.prisma.workerDeployment.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    let targetUrl: string;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (userDeployment) {
      const cleanUrl = userDeployment.workerUrl.replace(/\/$/, "");
      targetUrl = `${cleanUrl}/auth/google/token`;
      headers["Authorization"] = `Bearer ${userDeployment.apiSecretKey}`;

      const res = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: dto.code,
          redirect_uri: dto.redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new BadRequestException(data.error || "Failed to exchange Google authorization code via worker");
      }
      return data;
    }

    // 3. Direct exchange fallback if no worker deployed yet
    const tokenParams = new URLSearchParams({
      code: dto.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: dto.redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      throw new BadRequestException(
        tokenData.error_description || tokenData.error || "Google token exchange failed"
      );
    }

    // Fetch user profile using access token
    let profileData: any = null;
    if (tokenData.access_token) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      profileData = await userRes.json().catch(() => null);
    }

    return {
      ok: true,
      tokens: tokenData,
      user: profileData,
    };
  }
}
