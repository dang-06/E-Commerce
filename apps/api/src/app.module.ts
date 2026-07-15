import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ProductsModule } from "./modules/products/products.module.js";
import { PromotionsModule } from "./modules/promotions/promotions.module.js";

@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, ProductsModule, PromotionsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
