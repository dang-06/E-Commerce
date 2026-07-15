import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service.js";
import type { CreateProductDto, ProductImageInputDto, UpdateProductDto } from "./dto/product.dto.js";

type ProductWithImages = Prisma.ProductGetPayload<{ include: { images: true } }>;

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  listedPrice: string;
  stockQuantity: number | null;
  isPromotionEligible: boolean;
  discountAmount: string;
  isActive: boolean;
  sortOrder: number;
  deletedAt: Date | null;
  images: ProductImageResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImageResponse {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return products.map((product) => this.toProductResponse(product));
  }

  async getPublicBySlug(slug: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return this.toProductResponse(product);
  }

  async listAdmin(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
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
        listedPrice: BigInt(dto.listedPrice),
        stockQuantity: dto.stockQuantity ?? null,
        isPromotionEligible: dto.isPromotionEligible ?? true,
        discountAmount: BigInt(dto.discountAmount ?? 25000),
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        ...(dto.images && dto.images.length > 0
          ? { images: { create: this.mapImages(dto.images) } }
          : {}),
      };
      const product = await this.prisma.product.create({
        data,
        include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
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
          ...(dto.description !== undefined ? { description: this.optionalText(dto.description) } : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: this.optionalText(dto.imageUrl) } : {}),
          ...(dto.listedPrice !== undefined ? { listedPrice: BigInt(dto.listedPrice) } : {}),
          ...(dto.stockQuantity !== undefined ? { stockQuantity: dto.stockQuantity } : {}),
          ...(dto.isPromotionEligible !== undefined
            ? { isPromotionEligible: dto.isPromotionEligible }
            : {}),
          ...(dto.discountAmount !== undefined ? { discountAmount: BigInt(dto.discountAmount) } : {}),
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
        },
        include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
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
      include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    });
    return this.toProductResponse(product);
  }

  async softDelete(id: string): Promise<ProductResponse> {
    await this.ensureProductExists(id);
    const product = await this.prisma.product.update({
      where: { id: BigInt(id) },
      data: { isActive: false, deletedAt: new Date() },
      include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
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
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
