import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get('userType');
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    if (!userType) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const state = JSON.stringify({ userType });

    const googleAuthURL =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(googleAuthURL);
}
