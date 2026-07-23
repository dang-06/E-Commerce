import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SafeAdminResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "admin@example.local", type: String })
  email!: string;

  @ApiProperty({ example: "Admin User", type: String })
  fullName!: string;

  @ApiProperty({ enum: ["admin", "operator"], example: "admin", type: String })
  role!: "admin" | "operator";

  @ApiProperty({ enum: ["active", "locked"], example: "active", type: String })
  status!: "active" | "locked";

  @ApiPropertyOptional({
    example: "2026-07-21T09:00:00.000Z",
    format: "date-time",
    nullable: true,
    type: String,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;
}

export class LoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", type: String })
  accessToken!: string;

  @ApiProperty({ type: SafeAdminResponseDto })
  admin!: SafeAdminResponseDto;
}
