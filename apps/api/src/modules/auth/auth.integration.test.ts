import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { Controller, Get, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import bcrypt from "bcryptjs";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AccessTokenService } from "./token.service.js";
import { LoginRateLimiterService } from "./login-rate-limiter.service.js";
import type { AdminRepository } from "./repositories/admin.repository.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";
import { Roles } from "./decorators/roles.decorator.js";
import type { AdminWithPassword, AuthenticatedRequest, SafeAdmin } from "./auth.types.js";

@Controller("test")
class ProtectedTestController {
  @Get("admin-only")
  @Roles("admin")
  adminOnly(): { ok: true } {
    return { ok: true };
  }

  @Get("operator-or-admin")
  @Roles("operator", "admin")
  operatorOrAdmin(): { ok: true } {
    return { ok: true };
  }
}

class FakeAdminRepository implements AdminRepository {
  constructor(private readonly admins: Map<string, AdminWithPassword>) {}

  async findByEmail(email: string): Promise<AdminWithPassword | null> {
    return Promise.resolve(this.admins.get(email) ?? null);
  }

  async findById(id: string): Promise<AdminWithPassword | null> {
    return Promise.resolve([...this.admins.values()].find((admin) => admin.id === id) ?? null);
  }

  async updateLastLoginAt(id: string, lastLoginAt: Date): Promise<void> {
    const admin = [...this.admins.values()].find((candidate) => candidate.id === id);
    if (admin) {
      admin.lastLoginAt = lastLoginAt;
    }
    await Promise.resolve();
  }
}

interface TestContext {
  auth: AuthService;
  controller: AuthController;
  authGuard: AuthGuard;
  rolesGuard: RolesGuard;
}

async function createTestContext(): Promise<TestContext> {
  const passwordHash = await bcrypt.hash("Admin@123456", 8);
  const now = new Date("2026-07-15T00:00:00.000Z");
  const admins = new Map<string, AdminWithPassword>([
    [
      "admin@example.local",
      {
        id: "1",
        email: "admin@example.local",
        fullName: "Admin User",
        role: "admin",
        status: "active",
        passwordHash,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    [
      "operator@example.local",
      {
        id: "2",
        email: "operator@example.local",
        fullName: "Operator User",
        role: "operator",
        status: "active",
        passwordHash,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    [
      "locked@example.local",
      {
        id: "3",
        email: "locked@example.local",
        fullName: "Locked User",
        role: "operator",
        status: "locked",
        passwordHash,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  ]);

  const tokens = new AccessTokenService();
  const auth = new AuthService(
    new FakeAdminRepository(admins),
    tokens,
    new LoginRateLimiterService(),
  );
  const controller = new AuthController(auth);

  return {
    auth,
    controller,
    authGuard: new AuthGuard(auth),
    rolesGuard: new RolesGuard(new Reflector()),
  };
}

function requestWithAuthorization(token?: string): Request & AuthenticatedRequest {
  return {
    ip: "127.0.0.1",
    header: (name: string): string | undefined => {
      if (name.toLowerCase() === "authorization" && token) {
        return `Bearer ${token}`;
      }
      return undefined;
    },
  } as Request & AuthenticatedRequest;
}

function executionContext(
  request: Request & AuthenticatedRequest,
  handler: () => unknown,
): ExecutionContext {
  return {
    getClass: () => ProtectedTestController,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function getProtectedHandler(name: "adminOnly" | "operatorOrAdmin"): () => unknown {
  const value: unknown = Reflect.get(ProtectedTestController.prototype, name);
  if (typeof value !== "function") {
    throw new Error(`Missing protected test handler: ${name}`);
  }

  return value as () => unknown;
}

async function loginAs(context: TestContext, email: string): Promise<string> {
  const result = await context.controller.login(
    { email, password: "Admin@123456" },
    requestWithAuthorization(),
  );
  return result.accessToken;
}

void test("admin login succeeds and does not return password hash", async () => {
  const context = await createTestContext();
  const result = await context.controller.login(
    { email: "admin@example.local", password: "Admin@123456" },
    requestWithAuthorization(),
  );

  assert.equal(typeof result.accessToken, "string");
  assert.equal(result.admin.email, "admin@example.local");
  assert.equal(
    Object.hasOwn(result.admin as SafeAdmin & { passwordHash?: string }, "passwordHash"),
    false,
  );
});

void test("admin login rejects an invalid password", async () => {
  const context = await createTestContext();

  await assert.rejects(
    () =>
      context.controller.login(
        { email: "admin@example.local", password: "wrong-password" },
        requestWithAuthorization(),
      ),
    UnauthorizedException,
  );
});

void test("admin login rejects a locked account", async () => {
  const context = await createTestContext();

  await assert.rejects(
    () =>
      context.controller.login(
        { email: "locked@example.local", password: "Admin@123456" },
        requestWithAuthorization(),
      ),
    UnauthorizedException,
  );
});

void test("auth guard rejects unauthenticated requests", async () => {
  const context = await createTestContext();
  const guardContext = executionContext(
    requestWithAuthorization(),
    getProtectedHandler("operatorOrAdmin"),
  );

  await assert.rejects(() => context.authGuard.canActivate(guardContext), UnauthorizedException);
});

void test("me endpoint returns the authenticated admin profile", async () => {
  const context = await createTestContext();
  const adminToken = await loginAs(context, "admin@example.local");
  const request = requestWithAuthorization(adminToken);
  const guardContext = executionContext(request, getProtectedHandler("operatorOrAdmin"));

  assert.equal(await context.authGuard.canActivate(guardContext), true);
  assert.ok(request.admin);
  const profile = context.controller.me(request.admin);

  assert.equal(profile.email, "admin@example.local");
  assert.equal(profile.role, "admin");
  assert.equal(
    Object.hasOwn(profile as SafeAdmin & { passwordHash?: string }, "passwordHash"),
    false,
  );
});

void test("role guard allows admin access and blocks operator-only privileges", async () => {
  const context = await createTestContext();
  const adminToken = await loginAs(context, "admin@example.local");
  const adminRequest = requestWithAuthorization(adminToken);
  const adminOnlyContext = executionContext(adminRequest, getProtectedHandler("adminOnly"));

  assert.equal(await context.authGuard.canActivate(adminOnlyContext), true);
  assert.equal(context.rolesGuard.canActivate(adminOnlyContext), true);

  const operatorToken = await loginAs(context, "operator@example.local");
  const operatorRequest = requestWithAuthorization(operatorToken);
  const operatorContext = executionContext(operatorRequest, getProtectedHandler("operatorOrAdmin"));
  assert.equal(await context.authGuard.canActivate(operatorContext), true);
  assert.equal(context.rolesGuard.canActivate(operatorContext), true);

  const blockedContext = executionContext(operatorRequest, getProtectedHandler("adminOnly"));
  assert.throws(() => context.rolesGuard.canActivate(blockedContext), {
    message: "Insufficient permissions",
  });
});
