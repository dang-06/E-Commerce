import { Module } from "@nestjs/common";
import { AdminProductsController, PublicProductsController } from "./products.controller.js";
import { ProductsService } from "./products.service.js";

@Module({
  controllers: [PublicProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

