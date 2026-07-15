import { Injectable } from "@nestjs/common";
import type { Admin } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service.js";
import type { AdminRepository } from "./admin.repository.js";
import type { AdminWithPassword } from "../auth.types.js";

@Injectable()
export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AdminWithPassword | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });
    return admin ? this.mapAdmin(admin) : null;
  }

  async findById(id: string): Promise<AdminWithPassword | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: BigInt(id) },
    });
    return admin ? this.mapAdmin(admin) : null;
  }

  async updateLastLoginAt(id: string, lastLoginAt: Date): Promise<void> {
    await this.prisma.admin.update({
      where: { id: BigInt(id) },
      data: { lastLoginAt },
    });
  }

  private mapAdmin(admin: Admin): AdminWithPassword {
    return {
      id: admin.id.toString(),
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      status: admin.status,
      passwordHash: admin.passwordHash,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
