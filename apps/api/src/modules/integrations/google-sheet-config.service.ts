import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service.js";
import type { UpsertGoogleSheetConfigDto } from "./dto/google-sheet-config.dto.js";

const purposes = ["eligible_customers", "orders"] as const;
type Purpose = (typeof purposes)[number];

export interface GoogleSheetConfigResponse {
  id: string;
  purpose: Purpose;
  sheetUrl: string;
  spreadsheetId: string;
  worksheetName: string | null;
  phoneColumn: string | null;
  orderMapping: Record<string, unknown> | null;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleSheetConfigsResponse {
  eligibleCustomers: GoogleSheetConfigResponse | null;
  orders: GoogleSheetConfigResponse | null;
}

@Injectable()
export class GoogleSheetConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<GoogleSheetConfigsResponse> {
    const rows = await this.prisma.googleSheetConfig.findMany({
      orderBy: { purpose: "asc" },
    });
    return {
      eligibleCustomers: this.findByPurpose(rows, "eligible_customers"),
      orders: this.findByPurpose(rows, "orders"),
    };
  }

  async upsert(rawPurpose: string, dto: UpsertGoogleSheetConfigDto): Promise<GoogleSheetConfigResponse> {
    const purpose = this.parsePurpose(rawPurpose);
    const spreadsheetId = this.extractSpreadsheetId(dto.sheetUrl);
    const row = await this.prisma.googleSheetConfig.upsert({
      where: { purpose },
      update: {
        sheetUrl: dto.sheetUrl.trim(),
        spreadsheetId,
        worksheetName: this.optionalTrim(dto.worksheetName),
        phoneColumn: purpose === "eligible_customers" ? this.optionalTrim(dto.phoneColumn) : null,
        orderMapping: purpose === "orders" ? this.jsonObjectOrNull(dto.orderMapping) : Prisma.JsonNull,
        isActive: dto.isActive ?? true,
      },
      create: {
        purpose,
        sheetUrl: dto.sheetUrl.trim(),
        spreadsheetId,
        worksheetName: this.optionalTrim(dto.worksheetName),
        phoneColumn: purpose === "eligible_customers" ? this.optionalTrim(dto.phoneColumn) : null,
        orderMapping: purpose === "orders" ? this.jsonObjectOrNull(dto.orderMapping) : Prisma.JsonNull,
        isActive: dto.isActive ?? true,
      },
    });
    return this.toResponse(row);
  }

  async getActiveByPurpose(purpose: Purpose): Promise<GoogleSheetConfigResponse> {
    const row = await this.prisma.googleSheetConfig.findFirst({
      where: { purpose, isActive: true },
    });
    if (!row) {
      throw new NotFoundException("Google Sheet config is not active or not configured");
    }
    return this.toResponse(row);
  }

  private findByPurpose(
    rows: Awaited<ReturnType<PrismaService["googleSheetConfig"]["findMany"]>>,
    purpose: Purpose,
  ): GoogleSheetConfigResponse | null {
    const row = rows.find((candidate) => candidate.purpose === purpose);
    return row ? this.toResponse(row) : null;
  }

  private parsePurpose(value: string): Purpose {
    if ((purposes as readonly string[]).includes(value)) {
      return value as Purpose;
    }
    throw new BadRequestException("Unsupported Google Sheet purpose");
  }

  private extractSpreadsheetId(sheetUrl: string): string {
    let url: URL;
    try {
      url = new URL(sheetUrl);
    } catch {
      throw new BadRequestException("Google Sheet URL is invalid");
    }
    if (url.protocol !== "https:" || url.hostname !== "docs.google.com") {
      throw new BadRequestException("Only Google Sheets links from docs.google.com are supported");
    }
    const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(url.pathname);
    if (!match?.[1]) {
      throw new BadRequestException("Google Sheet URL must include a spreadsheet id");
    }
    return match[1];
  }

  private optionalTrim(value: string | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  private toResponse(row: {
    id: bigint;
    purpose: Purpose;
    sheetUrl: string;
    spreadsheetId: string;
    worksheetName: string | null;
    phoneColumn: string | null;
    orderMapping: unknown;
    isActive: boolean;
    lastSyncAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): GoogleSheetConfigResponse {
    return {
      id: row.id.toString(),
      purpose: row.purpose,
      sheetUrl: row.sheetUrl,
      spreadsheetId: row.spreadsheetId,
      worksheetName: row.worksheetName,
      phoneColumn: row.phoneColumn,
      orderMapping: this.objectOrNull(row.orderMapping),
      isActive: row.isActive,
      lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private objectOrNull(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private jsonObjectOrNull(value: Record<string, unknown> | undefined): Prisma.InputJsonObject | typeof Prisma.JsonNull {
    return value ? (value as Prisma.InputJsonObject) : Prisma.JsonNull;
  }
}
