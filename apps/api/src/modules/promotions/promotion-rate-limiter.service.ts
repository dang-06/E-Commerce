import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class PromotionRateLimiterService {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly maxAttempts = getConfig().promotionRateLimitMax;
  private readonly windowMs = getConfig().promotionRateLimitWindowMs;

  assertAllowed(ipHash: string, phoneHash: string): void {
    this.assertKeyAllowed(`ip:${ipHash}`);
    this.assertKeyAllowed(`phone:${phoneHash}`);
  }

  private assertKeyAllowed(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (bucket.count >= this.maxAttempts) {
      throw new HttpException("Too many promotion checks", HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
  }
}

