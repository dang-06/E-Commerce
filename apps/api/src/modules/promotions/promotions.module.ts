import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { GoogleSheetsClientService } from "../integrations/google-sheets-client.service.js";
import { AdminEligibleCustomersController, PromotionsController } from "./promotions.controller.js";
import { PromotionRateLimiterService } from "./promotion-rate-limiter.service.js";
import { PromotionTokenService } from "./promotion-token.service.js";
import { PromotionsService } from "./promotions.service.js";

@Module({
  imports: [AuthModule],
  controllers: [PromotionsController, AdminEligibleCustomersController],
  providers: [PromotionsService, PromotionTokenService, PromotionRateLimiterService, GoogleSheetsClientService],
  exports: [PromotionsService, PromotionTokenService],
})
export class PromotionsModule {}
