import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SaveGoogleConfigDto {
  @IsNotEmpty({ message: "Google Client ID is required" })
  @IsString()
  clientId: string;

  @IsNotEmpty({ message: "Google Client Secret is required" })
  @IsString()
  clientSecret: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authorizedRedirectUris?: string[];
}
