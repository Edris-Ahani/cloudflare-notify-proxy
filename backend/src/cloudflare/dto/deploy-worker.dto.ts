import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class DeployWorkerDto {
  @IsNotEmpty({ message: "Telegram bot ID is required" })
  @IsString()
  botId: string;

  @IsOptional()
  @IsString()
  defaultChatId?: string;

  @IsOptional()
  @IsString()
  scriptName?: string;
}
