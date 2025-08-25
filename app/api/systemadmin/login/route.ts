import bcrypt from "bcrypt";
import { db } from "../../../../lib/db";
import {SignJWT} from "jose";
import nodeCrypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      console.log("Missing credentials. Received data:", body);
      return NextResponse.json(
        { error: "Username or email and password are required." },
        { status: 400 }
      );
    }

    let user;

    if (login.includes("@")) {
      const emailHash = nodeCrypto.createHash("sha256").update(login).digest("hex");
      console.log("Generate Hash:" + emailHash);
      const [userByEmail] = await db.query("SELECT * FROM Admin WHERE email_hash = ?", [emailHash]);
      // @ts-ignore
      user = userByEmail.length > 0 ? userByEmail[0] : null;
    } else {
      const [userByUsername] = await db.query("SELECT * FROM Admin WHERE username = ?", [login]);
      // @ts-ignore
      user = userByUsername.length > 0 ? userByUsername[0] : null;
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (user.status === "disabled") {
      return NextResponse.json(
        { error: "Your account has been disabled. Please contact support." },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      admin_id: user.admin_id,
      username: user.username,
      role: user.role,
      email: user.email,
      permissions: user.permissions
          // @ts-ignore
        ? user.permissions.split(",").map((p) => p.trim())
        : [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .setIssuedAt()
      .setSubject(user.admin_id.toString())
      .sign(secret);

    const response = NextResponse.json(
      {
        message: "Login successful.",
        admin: {
          admin_id: user.admin_id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60, // 2 hours
    });

    await db.query(
      "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
      [user.admin_id, "Admin logged in", new Date().toISOString()]
    );

    return response;
  } catch (error) {
    console.error("[DEBUG] Error during admin login:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}