import { IsNotEmpty, IsString } from "class-validator";

export class AddTelegramBotDto {
  @IsNotEmpty({ message: "Bot token is required" })
  @IsString()
  botToken: string;
}
