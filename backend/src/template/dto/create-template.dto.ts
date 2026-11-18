import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTemplateDto {
  @IsNotEmpty({ message: "Template title is required" })
  @IsString()
  title: string;

  @IsNotEmpty({ message: "Template content is required" })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parseMode?: string;
}
