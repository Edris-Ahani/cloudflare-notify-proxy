import { IsNotEmpty, IsString } from "class-validator";

export class AddChannelDto {
  @IsNotEmpty({ message: "Bot ID is required" })
  @IsString()
  botId: string;

  @IsNotEmpty({ message: "Channel title is required" })
  @IsString()
  title: string;

  @IsNotEmpty({ message: "Chat ID is required" })
  @IsString()
  chatId: string;
}
