import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendTestMessageDto {
  @IsNotEmpty({ message: "Bot ID is required" })
  @IsString()
  botId: string;

  @IsNotEmpty({ message: "Chat ID is required" })
  @IsString()
  chatId: string;

  @IsNotEmpty({ message: "Message text is required" })
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  parseMode?: string;
}
