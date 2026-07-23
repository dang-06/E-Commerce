import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsObject, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class UpsertGoogleSheetConfigDto {
  @ApiProperty({
    example: "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit",
    maxLength: 2048,
  })
  @IsString()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  sheetUrl!: string;

  @ApiPropertyOptional({ example: "Sheet1", maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  worksheetName?: string;

  @ApiPropertyOptional({ example: "phone", maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneColumn?: string;

  @ApiPropertyOptional({
    example: {
      recipientName: "customer_name",
      recipientPhone: "phone",
      totalAmount: "total",
    },
  })
  @IsOptional()
  @IsObject()
  orderMapping?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean()
  isActive?: boolean;
}
