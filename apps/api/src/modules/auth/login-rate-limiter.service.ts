import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";

interface LoginAttempt {
  count: number;
  resetAt: number;
}

@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, LoginAttempt>();
  private readonly maxAttempts = getConfig().loginRateLimitMax;
  private readonly windowMs = getConfig().loginRateLimitWindowMs;

  assertAllowed(key: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || attempt.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (attempt.count >= this.maxAttempts) {
      throw new HttpException("Too many login attempts", HttpStatus.TOO_MANY_REQUESTS);
    }

    attempt.count += 1;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
