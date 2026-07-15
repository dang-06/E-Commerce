import { Module } from "@nestjs/common";
import { PromotionsModule } from "../promotions/promotions.module.js";
import { OrderQuoteStore } from "./order-quote-store.service.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

@Module({
  imports: [PromotionsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderQuoteStore],
  exports: [OrdersService],
})
export class OrdersModule {}
