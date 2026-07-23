import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import type { UpdateSiteSettingsDto } from "./dto/site-settings.dto.js";

const defaultSettingsKey = "default";

export interface SiteSettingsResponse {
  bannerButtonText: string;
  bannerEyebrow: string;
  bannerImageUrl: string | null;
  bannerSubtitle: string;
  bannerTitle: string;
  updatedAt: Date;
}

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SiteSettingsResponse> {
    const settings = await this.prisma.siteSettings.upsert({
      where: { key: defaultSettingsKey },
      update: {},
      create: {
        key: defaultSettingsKey,
      },
    });
    return this.toResponse(settings);
  }

  async update(dto: UpdateSiteSettingsDto): Promise<SiteSettingsResponse> {
    const settings = await this.prisma.siteSettings.upsert({
      where: { key: defaultSettingsKey },
      update: {
        ...(dto.bannerButtonText !== undefined ? { bannerButtonText: this.clean(dto.bannerButtonText) } : {}),
        ...(dto.bannerEyebrow !== undefined ? { bannerEyebrow: this.clean(dto.bannerEyebrow) } : {}),
        ...(dto.bannerImageUrl !== undefined ? { bannerImageUrl: this.optionalText(dto.bannerImageUrl) } : {}),
        ...(dto.bannerSubtitle !== undefined ? { bannerSubtitle: this.clean(dto.bannerSubtitle) } : {}),
        ...(dto.bannerTitle !== undefined ? { bannerTitle: this.clean(dto.bannerTitle) } : {}),
      },
      create: {
        key: defaultSettingsKey,
        ...(dto.bannerButtonText !== undefined ? { bannerButtonText: this.clean(dto.bannerButtonText) } : {}),
        ...(dto.bannerEyebrow !== undefined ? { bannerEyebrow: this.clean(dto.bannerEyebrow) } : {}),
        ...(dto.bannerImageUrl !== undefined ? { bannerImageUrl: this.optionalText(dto.bannerImageUrl) } : {}),
        ...(dto.bannerSubtitle !== undefined ? { bannerSubtitle: this.clean(dto.bannerSubtitle) } : {}),
        ...(dto.bannerTitle !== undefined ? { bannerTitle: this.clean(dto.bannerTitle) } : {}),
      },
    });
    return this.toResponse(settings);
  }

  private clean(value: string): string {
    return value.trim();
  }

  private optionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  private toResponse(settings: {
    bannerButtonText: string;
    bannerEyebrow: string;
    bannerImageUrl: string | null;
    bannerSubtitle: string;
    bannerTitle: string;
    updatedAt: Date;
  }): SiteSettingsResponse {
    return {
      bannerButtonText: settings.bannerButtonText,
      bannerEyebrow: settings.bannerEyebrow,
      bannerImageUrl: settings.bannerImageUrl,
      bannerSubtitle: settings.bannerSubtitle,
      bannerTitle: settings.bannerTitle,
      updatedAt: settings.updatedAt,
    };
  }
}
