import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@/config/roles";
import { hasPermission } from "@/config/roles";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "development-secret-change-in-production";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as Role | undefined;

    if (!role || !hasPermission(role, "delete")) {
      return NextResponse.json(
        { error: "Access denied: insufficient permissions." },
        { status: 403 },
      );
    }

    // Demo-only: no real deletion, just a successful response.
    return NextResponse.json({
      message: "Resource deleted successfully (demo).",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[RBAC] Error verifying token", error);
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 },
    );
  }
}

