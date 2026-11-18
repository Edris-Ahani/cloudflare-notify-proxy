import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { CloudflareService } from "./cloudflare.service";
import { SaveCloudflareConfigDto } from "./dto/save-config.dto";
import { DeployWorkerDto } from "./dto/deploy-worker.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("cloudflare")
export class CloudflareController {
  constructor(private readonly cloudflareService: CloudflareService) {}

  @Post("config")
  async saveConfig(
    @Request() req: { user: { userId: string } },
    @Body() dto: SaveCloudflareConfigDto
  ) {
    return this.cloudflareService.saveConfig(req.user.userId, dto);
  }

  @Get("config")
  async getConfig(@Request() req: { user: { userId: string } }) {
    return this.cloudflareService.getConfig(req.user.userId);
  }

  @Post("deploy-worker")
  async deployWorker(
    @Request() req: { user: { userId: string } },
    @Body() dto: DeployWorkerDto
  ) {
    return this.cloudflareService.deployWorker(req.user.userId, dto);
  }

  @Get("deployments")
  async listDeployments(@Request() req: { user: { userId: string } }) {
    return this.cloudflareService.listDeployments(req.user.userId);
  }
}
