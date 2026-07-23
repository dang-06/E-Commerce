import { Module } from "@nestjs/common";
import { SiteSettingsService } from "./site-settings.service.js";
import {
  AdminSiteSettingsController,
  PublicSiteSettingsController,
} from "./site-settings.controller.js";

@Module({
  controllers: [PublicSiteSettingsController, AdminSiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
