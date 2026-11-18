import { Module } from "@nestjs/common";
import { TemplateService } from "./template.service";
import { TemplateController } from "./template.controller";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [TelegramModule],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
