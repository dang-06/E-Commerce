import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ProductsModule } from "./modules/products/products.module.js";
import { PromotionsModule } from "./modules/promotions/promotions.module.js";
import { OrdersModule } from "./modules/orders/orders.module.js";
import { IntegrationsModule } from "./modules/integrations/integrations.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    AuthModule,
    ProductsModule,
    PromotionsModule,
    OrdersModule,
    IntegrationsModule,
    AuditModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
