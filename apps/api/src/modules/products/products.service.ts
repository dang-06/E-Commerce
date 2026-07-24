import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service.js";
import type {
  ProductAttributeInputDto,
  CreateProductDto,
  ProductColorVariantInputDto,
  ProductImageInputDto,
  UpdateProductDto,
} from "./dto/product.dto.js";

type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true; colorVariants: true };
}>;

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productAttributes: ProductAttributeResponse[];
  detailImageUrls: string[];
  sellerName: string | null;
  sellerYears: number | null;
  sellerPrimaryCategory: string | null;
  minimumOrderQuantity: number;
  shippingOrigin: string | null;
  shippingLeadTime: string | null;
  returnPolicy: string | null;
  reviewRating: number | null;
  reviewCount: number | null;
  reviewTags: ProductAttributeResponse[];
  reviewImageUrls: string[];
  qualityCertifications: ProductAttributeResponse[];
  packagingAttributes: ProductAttributeResponse[];
  listedPrice: string;
  stockQuantity: number | null;
  isPromotionEligible: boolean;
  discountAmount: string;
  isActive: boolean;
  sortOrder: number;
  deletedAt: Date | null;
  images: ProductImageResponse[];
  colorVariants: ProductColorVariantResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImageResponse {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductAttributeResponse {
  label: string;
  value: string;
}

export interface ProductColorVariantResponse {
  id: string;
  name: string;
  colorCode: string | null;
  imageUrl: string;
  sku: string | null;
  sortOrder: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: this.productIncludes(),
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return products.map((product) => this.toProductResponse(product));
  }

  async getPublicBySlug(slug: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: this.productIncludes(),
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return this.toProductResponse(product);
  }

  async listAdmin(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      include: this.productIncludes(),
      orderBy: [{ deletedAt: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    });
    return products.map((product) => this.toProductResponse(product));
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    try {
      const data: Prisma.ProductCreateInput = {
        sku: this.normalizeSku(dto.sku),
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        description: this.optionalText(dto.description),
        imageUrl: this.optionalText(dto.imageUrl),
        productAttributes: this.mapAttributes(dto.productAttributes ?? []),
        detailImageUrls: this.mapDetailImageUrls(dto.detailImageUrls ?? []),
        sellerName: this.optionalText(dto.sellerName),
        sellerYears: dto.sellerYears ?? null,
        sellerPrimaryCategory: this.optionalText(dto.sellerPrimaryCategory),
        minimumOrderQuantity: dto.minimumOrderQuantity ?? 1,
        shippingOrigin: this.optionalText(dto.shippingOrigin),
        shippingLeadTime: this.optionalText(dto.shippingLeadTime),
        returnPolicy: this.optionalText(dto.returnPolicy),
        reviewRating: dto.reviewRating !== undefined ? new Prisma.Decimal(dto.reviewRating) : null,
        reviewCount: dto.reviewCount ?? null,
        reviewTags: this.mapAttributes(dto.reviewTags ?? []),
        reviewImageUrls: this.mapDetailImageUrls(dto.reviewImageUrls ?? []),
        qualityCertifications: this.mapAttributes(dto.qualityCertifications ?? []),
        packagingAttributes: this.mapAttributes(dto.packagingAttributes ?? []),
        listedPrice: BigInt(dto.listedPrice),
        stockQuantity: dto.stockQuantity ?? null,
        isPromotionEligible: dto.isPromotionEligible ?? true,
        discountAmount: BigInt(dto.discountAmount ?? 25000),
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        ...(dto.images && dto.images.length > 0
          ? { images: { create: this.mapImages(dto.images) } }
          : {}),
        ...(dto.colorVariants && dto.colorVariants.length > 0
          ? { colorVariants: { create: this.mapColorVariants(dto.colorVariants) } }
          : {}),
      };
      const product = await this.prisma.product.create({
        data,
        include: this.productIncludes(),
      });
      return this.toProductResponse(product);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    await this.ensureProductExists(id);
    try {
      const product = await this.prisma.product.update({
        where: { id: BigInt(id) },
        data: {
          ...(dto.sku !== undefined ? { sku: this.normalizeSku(dto.sku) } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: this.optionalText(dto.description) }
            : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: this.optionalText(dto.imageUrl) } : {}),
          ...(dto.productAttributes !== undefined
            ? { productAttributes: this.mapAttributes(dto.productAttributes) }
            : {}),
          ...(dto.detailImageUrls !== undefined
            ? { detailImageUrls: this.mapDetailImageUrls(dto.detailImageUrls) }
            : {}),
          ...(dto.sellerName !== undefined
            ? { sellerName: this.optionalText(dto.sellerName) }
            : {}),
          ...(dto.sellerYears !== undefined ? { sellerYears: dto.sellerYears } : {}),
          ...(dto.sellerPrimaryCategory !== undefined
            ? { sellerPrimaryCategory: this.optionalText(dto.sellerPrimaryCategory) }
            : {}),
          ...(dto.minimumOrderQuantity !== undefined
            ? { minimumOrderQuantity: dto.minimumOrderQuantity }
            : {}),
          ...(dto.shippingOrigin !== undefined
            ? { shippingOrigin: this.optionalText(dto.shippingOrigin) }
            : {}),
          ...(dto.shippingLeadTime !== undefined
            ? { shippingLeadTime: this.optionalText(dto.shippingLeadTime) }
            : {}),
          ...(dto.returnPolicy !== undefined
            ? { returnPolicy: this.optionalText(dto.returnPolicy) }
            : {}),
          ...(dto.reviewRating !== undefined
            ? {
                reviewRating:
                  dto.reviewRating === null ? null : new Prisma.Decimal(dto.reviewRating),
              }
            : {}),
          ...(dto.reviewCount !== undefined ? { reviewCount: dto.reviewCount } : {}),
          ...(dto.reviewTags !== undefined
            ? { reviewTags: this.mapAttributes(dto.reviewTags) }
            : {}),
          ...(dto.reviewImageUrls !== undefined
            ? { reviewImageUrls: this.mapDetailImageUrls(dto.reviewImageUrls) }
            : {}),
          ...(dto.qualityCertifications !== undefined
            ? { qualityCertifications: this.mapAttributes(dto.qualityCertifications) }
            : {}),
          ...(dto.packagingAttributes !== undefined
            ? { packagingAttributes: this.mapAttributes(dto.packagingAttributes) }
            : {}),
          ...(dto.listedPrice !== undefined ? { listedPrice: BigInt(dto.listedPrice) } : {}),
          ...(dto.stockQuantity !== undefined ? { stockQuantity: dto.stockQuantity } : {}),
          ...(dto.isPromotionEligible !== undefined
            ? { isPromotionEligible: dto.isPromotionEligible }
            : {}),
          ...(dto.discountAmount !== undefined
            ? { discountAmount: BigInt(dto.discountAmount) }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.images !== undefined
            ? {
                images: {
                  deleteMany: {},
                  create: this.mapImages(dto.images),
                },
              }
            : {}),
          ...(dto.colorVariants !== undefined
            ? {
                colorVariants: {
                  deleteMany: {},
                  create: this.mapColorVariants(dto.colorVariants),
                },
              }
            : {}),
        },
        include: this.productIncludes(),
      });
      return this.toProductResponse(product);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async setVisibility(id: string, isActive: boolean): Promise<ProductResponse> {
    await this.ensureProductExists(id);
    const product = await this.prisma.product.update({
      where: { id: BigInt(id) },
      data: { isActive },
      include: this.productIncludes(),
    });
    return this.toProductResponse(product);
  }

  async softDelete(id: string): Promise<ProductResponse> {
    await this.ensureProductExists(id);
    const product = await this.prisma.product.update({
      where: { id: BigInt(id) },
      data: { isActive: false, deletedAt: new Date() },
      include: this.productIncludes(),
    });
    return this.toProductResponse(product);
  }

  private async ensureProductExists(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
  }

  private normalizeSku(sku: string): string {
    return sku.trim().toUpperCase();
  }

  private optionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  private mapImages(images: ProductImageInputDto[]): Prisma.ProductImageCreateManyProductInput[] {
    return images.map((image, index) => ({
      imageUrl: image.imageUrl.trim(),
      altText: this.optionalText(image.altText),
      sortOrder: image.sortOrder ?? index,
    }));
  }

  private mapAttributes(attributes: ProductAttributeInputDto[]): Prisma.InputJsonValue {
    return attributes
      .map((attribute) => ({
        label: attribute.label.trim(),
        value: attribute.value.trim(),
      }))
      .filter((attribute) => attribute.label && attribute.value);
  }

  private mapDetailImageUrls(imageUrls: string[]): Prisma.InputJsonValue {
    return imageUrls.map((imageUrl) => imageUrl.trim()).filter(Boolean);
  }

  private mapColorVariants(
    variants: ProductColorVariantInputDto[],
  ): Prisma.ProductColorVariantCreateManyProductInput[] {
    return variants.map((variant, index) => ({
      name: variant.name.trim(),
      colorCode: this.optionalText(variant.colorCode),
      imageUrl: variant.imageUrl.trim(),
      sku: this.optionalText(variant.sku),
      sortOrder: variant.sortOrder ?? index,
    }));
  }

  private productIncludes(): Prisma.ProductInclude {
    return {
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      colorVariants: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    };
  }

  private handleUniqueError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("Product SKU or slug already exists");
    }
  }

  private toProductResponse(product: ProductWithImages): ProductResponse {
    return {
      id: product.id.toString(),
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: product.imageUrl,
      productAttributes: this.toAttributeResponse(product.productAttributes),
      detailImageUrls: this.toDetailImageUrls(product.detailImageUrls),
      sellerName: product.sellerName,
      sellerYears: product.sellerYears,
      sellerPrimaryCategory: product.sellerPrimaryCategory,
      minimumOrderQuantity: product.minimumOrderQuantity,
      shippingOrigin: product.shippingOrigin,
      shippingLeadTime: product.shippingLeadTime,
      returnPolicy: product.returnPolicy,
      reviewRating: product.reviewRating === null ? null : product.reviewRating.toNumber(),
      reviewCount: product.reviewCount,
      reviewTags: this.toAttributeResponse(product.reviewTags),
      reviewImageUrls: this.toDetailImageUrls(product.reviewImageUrls),
      qualityCertifications: this.toAttributeResponse(product.qualityCertifications),
      packagingAttributes: this.toAttributeResponse(product.packagingAttributes),
      listedPrice: product.listedPrice.toString(),
      stockQuantity: product.stockQuantity,
      isPromotionEligible: product.isPromotionEligible,
      discountAmount: product.discountAmount.toString(),
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      deletedAt: product.deletedAt,
      images: product.images.map((image) => ({
        id: image.id.toString(),
        imageUrl: image.imageUrl,
        altText: image.altText,
        sortOrder: image.sortOrder,
      })),
      colorVariants: product.colorVariants.map((variant) => ({
        id: variant.id.toString(),
        name: variant.name,
        colorCode: variant.colorCode,
        imageUrl: variant.imageUrl,
        sku: variant.sku,
        sortOrder: variant.sortOrder,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toAttributeResponse(value: Prisma.JsonValue): ProductAttributeResponse[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return [];
      }
      const candidate = item as { label?: unknown; value?: unknown };
      if (typeof candidate.label !== "string" || typeof candidate.value !== "string") {
        return [];
      }
      const label = candidate.label.trim();
      const attributeValue = candidate.value.trim();
      return label && attributeValue ? [{ label, value: attributeValue }] : [];
    });
  }

  private toDetailImageUrls(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }
}
