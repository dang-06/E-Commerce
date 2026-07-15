import type { AdminWithPassword } from "../auth.types.js";

export const ADMIN_REPOSITORY = Symbol("ADMIN_REPOSITORY");

export interface AdminRepository {
  findByEmail(email: string): Promise<AdminWithPassword | null>;
  findById(id: string): Promise<AdminWithPassword | null>;
  updateLastLoginAt(id: string, lastLoginAt: Date): Promise<void>;
}
