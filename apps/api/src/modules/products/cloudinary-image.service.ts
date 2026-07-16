import { createHash } from "node:crypto";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";

export interface UploadedProductImage {
  imageUrl: string;
  publicId: string;
  width: number | null;
  height: number | null;
  format: string | null;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
  error?: { message?: string };
}

@Injectable()
export class CloudinaryImageService {
  async uploadProductImage(file: Express.Multer.File | undefined): Promise<UploadedProductImage> {
    if (!file) {
      throw new BadRequestException("Product image file is required");
    }
    this.validateImage(file);

    const config = getConfig().cloudinary;
    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      throw new InternalServerErrorException("Cloudinary is not configured");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.sign(
      {
        folder: config.productImageFolder,
        timestamp,
      },
      config.apiSecret,
    );

    const form = new FormData();
    const fileBytes = new Uint8Array(file.buffer);
    form.set("file", new Blob([fileBytes], { type: file.mimetype }), file.originalname);
    form.set("api_key", config.apiKey);
    form.set("folder", config.productImageFolder);
    form.set("timestamp", timestamp);
    form.set("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      body: form,
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;

    if (!response.ok || !body?.secure_url || !body.public_id) {
      throw new BadRequestException(body?.error?.message ?? "Could not upload product image");
    }

    return {
      format: body.format ?? null,
      height: body.height ?? null,
      imageUrl: body.secure_url,
      publicId: body.public_id,
      width: body.width ?? null,
    };
  }

  private validateImage(file: Express.Multer.File): void {
    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException("Only JPG, PNG, WEBP, or GIF images are supported");
    }
  }

  private sign(params: Record<string, string>, apiSecret: string): string {
    const payload = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
  }
}
