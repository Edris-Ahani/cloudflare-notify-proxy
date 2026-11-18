import { IsOptional, IsString, IsObject } from "class-validator";

export class DispatchTemplateDto {
  @IsOptional()
  @IsString()
  botId?: string;

  @IsOptional()
  @IsString()
  chatId?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string | number>;
}
