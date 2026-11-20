import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto/crypto.service";
import { SaveCloudflareConfigDto } from "./dto/save-config.dto";
import { DeployWorkerDto } from "./dto/deploy-worker.dto";
import { WORKER_SCRIPT_TEMPLATE } from "./worker-template";

@Injectable()
export class CloudflareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService
  ) {}

  async saveConfig(userId: string, dto: SaveCloudflareConfigDto) {
    const isValid = await this.verifyTokenWithCloudflare(dto.apiToken);
    if (!isValid) {
      throw new BadRequestException("Invalid Cloudflare API Token or insufficient permissions");
    }

    const { encrypted, iv, tag } = this.crypto.encrypt(dto.apiToken);

    return this.prisma.cloudflareConfig.upsert({
      where: { userId },
      create: {
        userId,
        accountId: dto.accountId.trim(),
        apiTokenEncrypted: encrypted,
        apiTokenIv: iv,
        apiTokenTag: tag,
        status: "ACTIVE",
      },
      update: {
        accountId: dto.accountId.trim(),
        apiTokenEncrypted: encrypted,
        apiTokenIv: iv,
        apiTokenTag: tag,
        status: "ACTIVE",
      },
      select: {
        id: true,
        accountId: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async getConfig(userId: string) {
    const config = await this.prisma.cloudflareConfig.findUnique({
      where: { userId },
      select: {
        id: true,
        accountId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!config) {
      throw new NotFoundException("Cloudflare configuration not found for this account");
    }

    return config;
  }

  async deployWorker(userId: string, dto: DeployWorkerDto) {
    // 1. Retrieve user's Cloudflare config
    const cfConfig = await this.prisma.cloudflareConfig.findUnique({
      where: { userId },
    });
    if (!cfConfig) {
      throw new BadRequestException("Please configure your Cloudflare account ID and API Token first");
    }

    const apiToken = this.crypto.decrypt(
      cfConfig.apiTokenEncrypted,
      cfConfig.apiTokenIv,
      cfConfig.apiTokenTag
    );

    // 2. Retrieve user's Telegram Bot
    const bot = await this.prisma.telegramBot.findFirst({
      where: { id: dto.botId, userId },
    });
    if (!bot) {
      throw new NotFoundException("Telegram bot not found");
    }

    const telegramBotToken = this.crypto.decrypt(
      bot.botTokenEncrypted,
      bot.botTokenIv,
      bot.botTokenTag
    );

    // 3. Generate script name & secret key
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const scriptName = dto.scriptName
      ? dto.scriptName.toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : `notify-${uniqueSuffix}`;

    const apiSecretKey = crypto.randomBytes(32).toString("hex");

    // 4. Upload ES Module Worker Script to Cloudflare using multipart/form-data
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/workers/scripts/${scriptName}`;

    const form = new FormData();
    form.append(
      "metadata",
      new Blob(
        [
          JSON.stringify({
            main_module: "worker.js",
            compatibility_date: "2024-01-01",
          }),
        ],
        { type: "application/json" }
      )
    );

    form.append(
      "worker.js",
      new Blob([WORKER_SCRIPT_TEMPLATE], { type: "application/javascript+module" }),
      "worker.js"
    );

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      const msg = err.errors?.[0]?.message || "Failed to upload worker script to Cloudflare";
      throw new BadRequestException(`Cloudflare API Error: ${msg}`);
    }

    // 5. Set Worker Secrets
    await this.setWorkerSecret(cfConfig.accountId, apiToken, scriptName, "TELEGRAM_BOT_TOKEN", telegramBotToken);
    await this.setWorkerSecret(cfConfig.accountId, apiToken, scriptName, "API_SECRET_KEY", apiSecretKey);

    // Optional: Inject Google OAuth secrets if configured by user
    const googleConfig = await this.prisma.googleAuthConfig.findUnique({
      where: { userId },
    });
    if (googleConfig) {
      const clientSecret = this.crypto.decrypt(
        googleConfig.clientSecretEncrypted,
        googleConfig.clientSecretIv,
        googleConfig.clientSecretTag
      );
      await this.setWorkerSecret(cfConfig.accountId, apiToken, scriptName, "GOOGLE_CLIENT_ID", googleConfig.clientId);
      await this.setWorkerSecret(cfConfig.accountId, apiToken, scriptName, "GOOGLE_CLIENT_SECRET", clientSecret);
    }

    if (dto.defaultChatId) {
      await this.setWorkerSecret(
        cfConfig.accountId,
        apiToken,
        scriptName,
        "TELEGRAM_DEFAULT_CHAT_ID",
        dto.defaultChatId
      );
    }

    // 6. Enable workers.dev subdomain route
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/workers/scripts/${scriptName}/subdomain`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: true }),
      }
    );

    // 7. Get user's account subdomain to construct live URL
    const subdomainRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/workers/subdomain`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );

    let workerUrl = `https://${scriptName}.workers.dev`;
    if (subdomainRes.ok) {
      const subData = await subdomainRes.json().catch(() => ({}));
      const sub = subData.result?.subdomain;
      if (sub) {
        workerUrl = `https://${scriptName}.${sub}.workers.dev`;
      }
    }

    // 8. Persist deployment record
    const deployment = await this.prisma.workerDeployment.create({
      data: {
        userId,
        scriptName,
        workerUrl,
        apiSecretKey,
        status: "ACTIVE",
      },
    });

    return {
      message: "Worker deployed successfully to your Cloudflare account",
      deployment: {
        id: deployment.id,
        scriptName: deployment.scriptName,
        workerUrl: deployment.workerUrl,
        apiSecretKey: deployment.apiSecretKey,
        status: deployment.status,
        createdAt: deployment.createdAt,
      },
    };
  }

  async listDeployments(userId: string) {
    return this.prisma.workerDeployment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteDeployment(userId: string, deploymentId: string) {
    const deployment = await this.prisma.workerDeployment.findFirst({
      where: { id: deploymentId, userId },
    });

    if (!deployment) {
      throw new NotFoundException("Worker deployment not found");
    }

    // Attempt to delete the script from Cloudflare account if config exists
    const cfConfig = await this.prisma.cloudflareConfig.findUnique({
      where: { userId },
    });

    if (cfConfig) {
      try {
        const apiToken = this.crypto.decrypt(
          cfConfig.apiTokenEncrypted,
          cfConfig.apiTokenIv,
          cfConfig.apiTokenTag
        );
        const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/workers/scripts/${deployment.scriptName}`;
        await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });
      } catch {
        // Proceed with database deletion even if remote Cloudflare call fails
      }
    }

    // Delete record from database
    await this.prisma.workerDeployment.delete({
      where: { id: deploymentId },
    });

    return {
      ok: true,
      message: `Worker deployment '${deployment.scriptName}' deleted successfully`,
    };
  }

  private async verifyTokenWithCloudflare(token: string): Promise<boolean> {
    try {
      const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => ({}));
      return Boolean(res.ok && data.success);
    } catch {
      return false;
    }
  }

  private async setWorkerSecret(
    accountId: string,
    apiToken: string,
    scriptName: string,
    name: string,
    text: string
  ): Promise<void> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}/secrets`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        text,
        type: "secret_text",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new InternalServerErrorException(
        `Failed to set secret ${name}: ${err.errors?.[0]?.message || "Unknown error"}`
      );
    }
  }
}
