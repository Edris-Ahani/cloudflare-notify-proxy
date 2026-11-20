import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class InitiateTelegramOtpDto {
  @IsNotEmpty({ message: "Phone number is required" })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, {
    message: "Phone number must be a valid Iranian mobile number (e.g., 09123456789 or +989123456789)",
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  lang?: string;
}

export class VerifyTelegramOtpDto {
  @IsNotEmpty({ message: "Session token is required" })
  @IsString()
  sessionToken: string;

  @IsOptional()
  @IsString()
  otpCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password?: string;
}

export class InitiateForgotPasswordDto {
  @IsNotEmpty({ message: "Phone number is required" })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, {
    message: "Phone number must be a valid Iranian mobile number (e.g., 09123456789 or +989123456789)",
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  lang?: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: "Session token is required" })
  @IsString()
  sessionToken: string;

  @IsNotEmpty({ message: "Verification OTP code is required" })
  @IsString()
  @MinLength(4, { message: "OTP code must be at least 4 digits" })
  otpCode: string;

  @IsNotEmpty({ message: "New password is required" })
  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters long" })
  newPassword: string;

  @IsOptional()
  @IsString()
  lang?: string;
}
