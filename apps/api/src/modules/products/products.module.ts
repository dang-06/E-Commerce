import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AdminProductsController, PublicProductsController } from "./products.controller.js";
import { CloudinaryImageService } from "./cloudinary-image.service.js";
import { ProductsService } from "./products.service.js";

@Module({
  imports: [AuthModule],
  controllers: [PublicProductsController, AdminProductsController],
  providers: [ProductsService, CloudinaryImageService],
  exports: [ProductsService],
})
export class ProductsModule {}
