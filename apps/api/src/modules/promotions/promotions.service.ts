import { BadRequestException, Injectable } from "@nestjs/common";
import type { EligibleCustomer, PromotionRule } from "@prisma/client";
import * as XLSX from "xlsx";
import { getConfig } from "../../config/app.config.js";
import { PrismaService } from "../../database/prisma.service.js";
import { GoogleSheetsClientService } from "../integrations/google-sheets-client.service.js";
import type { ImportEligibleCustomersDto, ListEligibleCustomersQueryDto } from "./dto/promotion.dto.js";
import { PromotionRateLimiterService } from "./promotion-rate-limiter.service.js";
import { PromotionTokenService } from "./promotion-token.service.js";
import { hashSensitiveValue } from "./utils/hash.js";
import {
  InvalidVietnamesePhoneError,
  maskVietnamesePhone,
  normalizeVietnamesePhone,
} from "./utils/phone.js";

interface ParsedImportRow {
  phone: string;
  sourceCustomerId?: string;
}

export interface PromotionCheckResponse {
  eligible: boolean;
  promotionToken?: string;
  expiresAt?: Date;
}

export interface EligibleCustomerResponse {
  id: string;
  phoneMasked: string;
  phoneHash: string;
  source: string;
  sourceCustomerId: string | null;
  eligibilityReason: string;
  successfulOrderAt: Date | null;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportEligibleCustomersResult {
  success: number;
  updated: number;
  invalid: number;
  duplicate: number;
}

@Injectable()
export class PromotionsService {
  private readonly secret = getConfig().authSecret;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: PromotionTokenService,
    private readonly rateLimiter: PromotionRateLimiterService,
    private readonly sheets: GoogleSheetsClientService,
  ) {}

  async check(phone: string, ip: string, userAgent: string | undefined): Promise<PromotionCheckResponse> {
    const normalizedPhone = this.normalizePhone(phone);
    const phoneHash = this.hash(normalizedPhone);
    const ipHash = this.hash(ip);
    this.rateLimiter.assertAllowed(ipHash, phoneHash);

    const [sheetEligible, storedEligibleCustomer, rule] = await Promise.all([
      this.sheets.isPhoneEligible(normalizedPhone),
      this.prisma.eligibleCustomer.findUnique({ where: { phoneHash } }),
      this.findActivePromotionRule(),
    ]);

    const eligibleCustomer =
      sheetEligible === null
        ? storedEligibleCustomer
        : await this.syncSheetEligibleCustomer(normalizedPhone, phoneHash, sheetEligible, storedEligibleCustomer);
    const isEligible = Boolean(eligibleCustomer?.isActive);
    if (!isEligible || !rule) {
      await this.recordPromotionCheck(phoneHash, false, ipHash, userAgent, null, null);
      return { eligible: false };
    }

    const promotionRuleVersion = this.ruleVersion(rule);
    const signed = this.tokens.sign(phoneHash, rule.code, promotionRuleVersion);
    await this.recordPromotionCheck(
      phoneHash,
      true,
      ipHash,
      userAgent,
      signed.jti,
      signed.expiresAt,
    );

    return {
      eligible: true,
      promotionToken: signed.token,
      expiresAt: signed.expiresAt,
    };
  }

  async listEligibleCustomers(query: ListEligibleCustomersQueryDto): Promise<EligibleCustomerResponse[]> {
    const customers = await this.prisma.eligibleCustomer.findMany({
      where: {
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        ...(query.source ? { source: query.source } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: query.limit ?? 50,
    });
    return customers.map((customer) => this.toEligibleCustomerResponse(customer));
  }

  async setEligibleCustomerStatus(id: string, isActive: boolean): Promise<EligibleCustomerResponse> {
    const customer = await this.prisma.eligibleCustomer.update({
      where: { id: BigInt(id) },
      data: { isActive },
    });
    return this.toEligibleCustomerResponse(customer);
  }

  async importEligibleCustomers(
    file: Express.Multer.File | undefined,
    dto: ImportEligibleCustomersDto,
  ): Promise<ImportEligibleCustomersResult> {
    if (!file) {
      throw new BadRequestException("Import file is required");
    }

    const rows = this.parseImportRows(file);
    const seenHashes = new Set<string>();
    const result: ImportEligibleCustomersResult = {
      success: 0,
      updated: 0,
      invalid: 0,
      duplicate: 0,
    };

    for (const row of rows) {
      let normalizedPhone: string;
      try {
        normalizedPhone = this.normalizePhone(row.phone);
      } catch (error) {
        if (error instanceof InvalidVietnamesePhoneError) {
          result.invalid += 1;
          continue;
        }
        throw error;
      }

      const phoneHash = this.hash(normalizedPhone);
      if (seenHashes.has(phoneHash)) {
        result.duplicate += 1;
        continue;
      }
      seenHashes.add(phoneHash);

      const existing = await this.prisma.eligibleCustomer.findUnique({ where: { phoneHash } });
      const sourceCustomerId = row.sourceCustomerId ?? dto.sourceCustomerId;
      if (existing) {
        await this.prisma.eligibleCustomer.update({
          where: { phoneHash },
          data: {
            phoneNormalized: normalizedPhone,
            source: dto.source,
            sourceCustomerId: sourceCustomerId ?? existing.sourceCustomerId,
            eligibilityReason: dto.eligibilityReason ?? existing.eligibilityReason,
            isActive: true,
          },
        });
        result.updated += 1;
      } else {
        await this.prisma.eligibleCustomer.create({
          data: {
            phoneNormalized: normalizedPhone,
            phoneHash,
            source: dto.source,
            sourceCustomerId: sourceCustomerId ?? null,
            eligibilityReason: dto.eligibilityReason ?? "imported",
            isActive: true,
          },
        });
        result.success += 1;
      }
    }

    return result;
  }

  normalizePhone(phone: string): string {
    return normalizeVietnamesePhone(phone);
  }

  hashPhone(phone: string): string {
    return this.hash(this.normalizePhone(phone));
  }

  private async findActivePromotionRule(): Promise<PromotionRule | null> {
    const now = new Date();
    return this.prisma.promotionRule.findFirst({
      where: {
        code: "PHONE_25000",
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { id: "desc" },
    });
  }

  private async recordPromotionCheck(
    phoneHash: string,
    isEligible: boolean,
    ipHash: string,
    userAgent: string | undefined,
    tokenId: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.prisma.promotionCheck.create({
      data: {
        phoneHash,
        isEligible,
        ipHash,
        userAgent: userAgent?.slice(0, 255) ?? null,
        tokenId,
        expiresAt,
      },
    });
  }

  private async syncSheetEligibleCustomer(
    normalizedPhone: string,
    phoneHash: string,
    isEligible: boolean,
    existing: EligibleCustomer | null,
  ): Promise<EligibleCustomer | null> {
    if (existing) {
      return this.prisma.eligibleCustomer.update({
        where: { phoneHash },
        data: {
          isActive: isEligible,
          phoneNormalized: normalizedPhone,
          source: "sheet",
        },
      });
    }
    if (!isEligible) {
      return null;
    }
    return this.prisma.eligibleCustomer.create({
      data: {
        eligibilityReason: "imported",
        isActive: true,
        phoneHash,
        phoneNormalized: normalizedPhone,
        source: "sheet",
      },
    });
  }

  private parseImportRows(file: Express.Multer.File): ParsedImportRow[] {
    const filename = file.originalname.toLowerCase();
    if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      return this.parseWorkbookRows(file.buffer);
    }
    if (filename.endsWith(".csv") || filename.endsWith(".txt")) {
      return this.parseDelimitedRows(file.buffer.toString("utf8"), ",");
    }
    if (filename.endsWith(".tsv")) {
      return this.parseDelimitedRows(file.buffer.toString("utf8"), "\t");
    }

    throw new BadRequestException("Only CSV, TSV, XLS, or XLSX files are supported");
  }

  private parseWorkbookRows(buffer: Buffer): ParsedImportRow[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return [];
    }
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      return [];
    }
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    return rawRows.flatMap((row, index) => this.parseRawRow(row, index));
  }

  private parseDelimitedRows(content: string, delimiter: "," | "\t"): ParsedImportRow[] {
    return content
      .split(/\r?\n/)
      .flatMap((line, index) => this.parseRawRow(this.splitDelimitedLine(line, delimiter), index));
  }

  private splitDelimitedLine(line: string, delimiter: "," | "\t"): string[] {
    if (delimiter === "\t") {
      return line.split("\t").map((value) => value.trim());
    }

    const values: string[] = [];
    let current = "";
    let insideQuotes = false;
    for (const char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  private parseRawRow(row: unknown[], index: number): ParsedImportRow[] {
    const [phoneValue, sourceCustomerIdValue] = row;
    const phone = this.cellToString(phoneValue).trim();
    if (!phone) {
      return [];
    }
    if (index === 0 && /phone|sdt|số điện thoại|so dien thoai/i.test(phone)) {
      return [];
    }

    const sourceCustomerId = this.cellToString(sourceCustomerIdValue).trim();
    return [
      {
        phone,
        ...(sourceCustomerId ? { sourceCustomerId } : {}),
      },
    ];
  }

  private cellToString(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
      return value.toString();
    }
    return "";
  }

  private ruleVersion(rule: PromotionRule): number {
    return Math.floor(rule.updatedAt.getTime() / 1000);
  }

  private hash(value: string): string {
    return hashSensitiveValue(value, this.secret);
  }

  private toEligibleCustomerResponse(customer: EligibleCustomer): EligibleCustomerResponse {
    return {
      id: customer.id.toString(),
      phoneMasked: maskVietnamesePhone(customer.phoneNormalized),
      phoneHash: customer.phoneHash,
      source: customer.source,
      sourceCustomerId: customer.sourceCustomerId,
      eligibilityReason: customer.eligibilityReason,
      successfulOrderAt: customer.successfulOrderAt,
      usageCount: customer.usageCount,
      usageLimit: customer.usageLimit,
      isActive: customer.isActive,
      importedAt: customer.importedAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
