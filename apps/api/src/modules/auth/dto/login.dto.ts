import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@example.local", format: "email", type: String })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin@123456", minLength: 8, type: String })
  @IsString()
  @MinLength(8)
  password!: string;
}
