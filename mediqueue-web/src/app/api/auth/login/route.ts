import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "development-secret-change-in-production";

export async function POST() {
  const secret = new TextEncoder().encode(AUTH_SECRET);
  const token = await new SignJWT({ sub: "demo-user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return NextResponse.json({ token });
}
