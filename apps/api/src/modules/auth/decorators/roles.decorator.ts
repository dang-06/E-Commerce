import { SetMetadata } from "@nestjs/common";
import type { AdminRole } from "../auth.types.js";

export const ROLES_KEY = "roles";

export function Roles(...roles: AdminRole[]) {
  return SetMetadata(ROLES_KEY, roles);
}
