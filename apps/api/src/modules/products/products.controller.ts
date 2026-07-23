import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CloudinaryImageService, type UploadedProductImage } from "./cloudinary-image.service.js";
import {
  CreateProductDto,
  SetProductVisibilityDto,
  UpdateProductDto,
} from "./dto/product.dto.js";
import {
  ProductResponseDto,
  UploadedProductImageResponseDto,
} from "./dto/product-response.dto.js";
import { ProductsService, type ProductResponse } from "./products.service.js";

@ApiTags("products")
@Controller("products")
export class PublicProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: [ProductResponseDto] })
  list(): Promise<ProductResponse[]> {
    return this.products.listPublic();
  }

  @Get(":slug")
  @ApiParam({ name: "slug", example: "nuoc-hoa-floral-50ml" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: "Product not found." })
  getBySlug(@Param("slug") slug: string): Promise<ProductResponse> {
    return this.products.getPublicBySlug(slug);
  }
}

@ApiTags("admin products")
@ApiBearerAuth("bearer")
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly images: CloudinaryImageService,
  ) {}

  @Get()
  @Roles("operator", "admin")
  @ApiOkResponse({ type: [ProductResponseDto] })
  list(): Promise<ProductResponse[]> {
    return this.products.listAdmin();
  }

  @Post()
  @Roles("admin")
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return this.products.create(dto);
  }

  @Post("images")
  @Roles("admin")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
          callback(new BadRequestException("Only JPG, PNG, WEBP, or GIF images are supported"), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiCreatedResponse({ type: UploadedProductImageResponseDto })
  uploadImage(@UploadedFile() file: Express.Multer.File | undefined): Promise<UploadedProductImage> {
    return this.images.uploadProductImage(file);
  }

  @Patch(":id")
  @Roles("admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: "Product not found." })
  update(@Param("id") id: string, @Body() dto: UpdateProductDto): Promise<ProductResponse> {
    return this.products.update(id, dto);
  }

  @Patch(":id/visibility")
  @Roles("admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: "Product not found." })
  setVisibility(
    @Param("id") id: string,
    @Body() dto: SetProductVisibilityDto,
  ): Promise<ProductResponse> {
    return this.products.setVisibility(id, dto.isActive);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: "Product not found." })
  softDelete(@Param("id") id: string): Promise<ProductResponse> {
    return this.products.softDelete(id);
  }
}
