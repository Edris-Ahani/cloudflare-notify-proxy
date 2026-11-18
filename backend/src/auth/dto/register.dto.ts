import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "Phone number is required" })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, {
    message: "Invalid phone number format. Expected Iranian mobile format (e.g. 09123456789 or +989123456789)",
  })
  phoneNumber: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;
}
