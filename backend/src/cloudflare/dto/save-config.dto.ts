import { IsNotEmpty, IsString } from "class-validator";

export class SaveCloudflareConfigDto {
  @IsNotEmpty({ message: "Account ID is required" })
  @IsString()
  accountId: string;

  @IsNotEmpty({ message: "API Token is required" })
  @IsString()
  apiToken: string;
}
