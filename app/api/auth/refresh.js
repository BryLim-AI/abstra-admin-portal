import { SignJWT, jwtVerify } from "jose";
import cookie from "cookie";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(refreshToken, secret);

        const newAccessToken = await new SignJWT({ user: payload.user })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("15m") // 15 minutes validity
            .sign(secret);

        res.setHeader("Set-Cookie", cookie.serialize("token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 900, // 15 minutes
        }));

        res.status(200).json({ user: payload.user, token: newAccessToken });
    } catch (error) {
        console.error("Token refresh failed:", error);
        res.status(401).json({ error: "Invalid refresh token" });
    }
}
