import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import type { Role } from "@/config/roles";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "development-secret-change-in-production";

const DEFAULT_USER_ID = "operator-1";
const DEFAULT_ROLE: Role = "admin";

export async function POST() {
  const secret = new TextEncoder().encode(AUTH_SECRET);
  const token = await new SignJWT({
    sub: DEFAULT_USER_ID,
    role: DEFAULT_ROLE,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return NextResponse.json({
    token,
    user: { id: DEFAULT_USER_ID, role: DEFAULT_ROLE },
  });
}
