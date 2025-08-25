import { NextResponse } from "next/server";
import { jwtVerify } from "jose";


async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

const permissionMapping = {
  "/pages/system_admin/co_admin": "manage_users",
  "/pages/system_admin/propertyManagement": "approve_properties",
  "/pages/system_admin/announcement": "manage_announcements",
  "/pages/system_admin/bug_report": "view_reports",
  "/pages/system_admin/activityLog": "view_log",
  "/pages/system_admin/tenant_landlord": "tenant_landlord_management",
};

// Pages that do not require permission checks
const excludePages = [
  "/pages/system_admin/dashboard",
  "/pages/system_admin/profile",
  "/pages/system_admin/supportIssues",

];

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    if (req.nextUrl.pathname.startsWith("/pages/system_admin") || req.nextUrl.pathname.startsWith("/pages/admin_login")) {
      return NextResponse.redirect(new URL("/pages/admin_login", req.url));
    }
    return NextResponse.redirect(new URL("/pages/auth/login", req.url));
  }

  try {
    const decoded = await verifyToken(token);

    if (!decoded) {
      if (req.nextUrl.pathname.startsWith("/pages/tenant")) {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
      } else if (req.nextUrl.pathname.startsWith("/pages/landlord")) {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
      } else {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
      }
    }

    const { userType, role, permissions } = decoded;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/system_admin")) {
      if (role !== "super-admin" && role !== "co-admin" && role !== "superadmin") {
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      if (excludePages.some(page => pathname.startsWith(page))) {
        return NextResponse.next();
      }

      if (!permissions || !Array.isArray(permissions)) {
        console.error("Permissions are missing or invalid for admin:", decoded);
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      const requiredPermissionKey = Object.keys(permissionMapping).find(key =>
          pathname.startsWith(key)
      );

      if (requiredPermissionKey) {
        const requiredPermission = permissionMapping[requiredPermissionKey];

        if (!permissions.includes(requiredPermission)) {
          return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/pages/admin_login", req.url));
  }
}

export const config = {
  matcher: [
    "/pages/tenant/:path*",
    "/pages/landlord/:path*",
    "/pages/system_admin/:path*",
    "/pages/commons/:path*",
  ],
};
