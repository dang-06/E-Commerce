import { Module } from "@nestjs/common";
import { AdminEligibleCustomersController, PromotionsController } from "./promotions.controller.js";
import { PromotionRateLimiterService } from "./promotion-rate-limiter.service.js";
import { PromotionTokenService } from "./promotion-token.service.js";
import { PromotionsService } from "./promotions.service.js";

@Module({
  controllers: [PromotionsController, AdminEligibleCustomersController],
  providers: [PromotionsService, PromotionTokenService, PromotionRateLimiterService],
  exports: [PromotionsService, PromotionTokenService],
})
export class PromotionsModule {}

