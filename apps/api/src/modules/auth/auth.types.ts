export type AdminRole = "admin" | "operator";
export type AdminStatus = "active" | "locked";

export interface SafeAdmin {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminWithPassword extends SafeAdmin {
  passwordHash: string;
}

export interface AuthenticatedRequest {
  admin?: SafeAdmin;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
}
