import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { TemplateService } from "./template.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("templates")
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateTemplateDto
  ) {
    return this.templateService.create(req.user.userId, dto);
  }

  @Get()
  async list(@Request() req: { user: { userId: string } }) {
    return this.templateService.list(req.user.userId);
  }

  @Delete(":id")
  async delete(
    @Request() req: { user: { userId: string } },
    @Param("id") id: string
  ) {
    return this.templateService.delete(req.user.userId, id);
  }
}
