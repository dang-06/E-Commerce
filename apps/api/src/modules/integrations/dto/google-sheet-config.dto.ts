import { Transform } from "class-transformer";
import { IsBoolean, IsObject, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class UpsertGoogleSheetConfigDto {
  @IsString()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  sheetUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  worksheetName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneColumn?: string;

  @IsOptional()
  @IsObject()
  orderMapping?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean()
  isActive?: boolean;
}
