import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import {
  CreateProductDto,
  SetProductVisibilityDto,
  UpdateProductDto,
} from "./dto/product.dto.js";
import { ProductsService, type ProductResponse } from "./products.service.js";

@ApiTags("products")
@Controller("products")
export class PublicProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(): Promise<ProductResponse[]> {
    return this.products.listPublic();
  }

  @Get(":slug")
  getBySlug(@Param("slug") slug: string): Promise<ProductResponse> {
    return this.products.getPublicBySlug(slug);
  }
}

@ApiTags("admin products")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Roles("operator", "admin")
  list(): Promise<ProductResponse[]> {
    return this.products.listAdmin();
  }

  @Post()
  @Roles("admin")
  create(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return this.products.create(dto);
  }

  @Patch(":id")
  @Roles("admin")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto): Promise<ProductResponse> {
    return this.products.update(id, dto);
  }

  @Patch(":id/visibility")
  @Roles("admin")
  setVisibility(
    @Param("id") id: string,
    @Body() dto: SetProductVisibilityDto,
  ): Promise<ProductResponse> {
    return this.products.setVisibility(id, dto.isActive);
  }

  @Delete(":id")
  @Roles("admin")
  softDelete(@Param("id") id: string): Promise<ProductResponse> {
    return this.products.softDelete(id);
  }
}
