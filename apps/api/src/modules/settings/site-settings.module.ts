import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { SiteSettingsService } from "./site-settings.service.js";
import {
  AdminSiteSettingsController,
  PublicSiteSettingsController,
} from "./site-settings.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [PublicSiteSettingsController, AdminSiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
