import assert from "node:assert/strict";
import test from "node:test";
import { BadGatewayException } from "@nestjs/common";
import { CloudinaryImageService } from "./cloudinary-image.service.js";

const validVideoFile = {
  buffer: Buffer.from("fake video bytes"),
  mimetype: "video/mp4",
  originalname: "intro.mp4",
} as Express.Multer.File;

void test("video upload returns a clear gateway error when Cloudinary cannot be reached", async () => {
  const originalFetch = globalThis.fetch;
  const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const originalApiKey = process.env.CLOUDINARY_API_KEY;
  const originalApiSecret = process.env.CLOUDINARY_API_SECRET;

  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";
  globalThis.fetch = () => Promise.reject(new TypeError("fetch failed"));

  try {
    const service = new CloudinaryImageService();
    await assert.rejects(
      () => service.uploadProductVideo(validVideoFile),
      (error: unknown) =>
        error instanceof BadGatewayException &&
        error.message.includes("Could not connect to Cloudinary"),
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("CLOUDINARY_CLOUD_NAME", originalCloudName);
    restoreEnv("CLOUDINARY_API_KEY", originalApiKey);
    restoreEnv("CLOUDINARY_API_SECRET", originalApiSecret);
  }
});

function restoreEnv(
  name: "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET",
  value: string | undefined,
): void {
  if (value === undefined) {
    if (name === "CLOUDINARY_CLOUD_NAME") {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    } else if (name === "CLOUDINARY_API_KEY") {
      delete process.env.CLOUDINARY_API_KEY;
    } else {
      delete process.env.CLOUDINARY_API_SECRET;
    }
    return;
  }
  process.env[name] = value;
}
