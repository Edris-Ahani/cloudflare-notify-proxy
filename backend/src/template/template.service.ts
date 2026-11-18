import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTemplateDto } from "./dto/create-template.dto";

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.messageTemplate.create({
      data: {
        userId,
        title: dto.title.trim(),
        content: dto.content,
        parseMode: dto.parseMode || "MarkdownV2",
      },
    });
  }

  async list(userId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(userId: string, templateId: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    return this.prisma.messageTemplate.delete({
      where: { id: templateId },
    });
  }

  render(template: string, variables: Record<string, string | number>): string {
    let output = template;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      output = output.replace(regex, String(val));
    }
    return output;
  }
}
