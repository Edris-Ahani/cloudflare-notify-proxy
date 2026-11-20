import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ExchangeGoogleTokenDto {
  @IsNotEmpty({ message: "Authorization code is required" })
  @IsString()
  code: string;

  @IsNotEmpty({ message: "Redirect URI is required" })
  @IsString()
  redirectUri: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;
}
