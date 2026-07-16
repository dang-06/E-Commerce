import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PromotionsModule } from "../promotions/promotions.module.js";
import { OrderQuoteStore } from "./order-quote-store.service.js";
import { AdminOrdersController, OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

@Module({
  imports: [AuthModule, PromotionsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderQuoteStore],
  exports: [OrdersService],
})
export class OrdersModule {}
