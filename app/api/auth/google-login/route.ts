
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { GOOGLE_CLIENT_ID, REDIRECT_URI_SIGNIN } = process.env;

    if (!GOOGLE_CLIENT_ID || !REDIRECT_URI_SIGNIN) {
        return NextResponse.json(
            { error: "Missing GOOGLE_CLIENT_ID or REDIRECT_URI_SIGNIN in environment variables" },
            { status: 500 }
        );
    }

    const googleAuthURL =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI_SIGNIN}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile`;

    return NextResponse.redirect(googleAuthURL);
}
