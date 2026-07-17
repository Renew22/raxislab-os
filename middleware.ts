import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "raxislab_fallback_secret_change_in_prod"
);

// Rutas que requieren auth
const PROTECTED = ["/cliente", "/admin-saas"];
// Rutas solo para ADMIN
const ADMIN_ONLY = ["/admin-saas"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("raxislab_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login-saas?next=" + pathname, req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/cliente/" + payload.clientSlug, req.url));
    }

    // Clientes solo pueden ver su propio slug
    if (pathname.startsWith("/cliente/") && role === "CLIENT") {
      const slug = pathname.split("/")[2];
      if (slug && slug !== payload.clientSlug) {
        return NextResponse.redirect(new URL("/cliente/" + payload.clientSlug, req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login-saas", req.url));
  }
}

export const config = {
  matcher: ["/cliente/:path*", "/admin-saas/:path*"],
};
