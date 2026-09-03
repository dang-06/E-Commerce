import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSpxAccountDto {
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone!: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(64)
  email?: string;
}
