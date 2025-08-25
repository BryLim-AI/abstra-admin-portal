import { NextRequest } from "next/server";
import { db } from "@/lib/db"; // adjust this if your path is different

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, enable_2fa } = body;

        if (!user_id || typeof enable_2fa !== "boolean") {
            return new Response(
                JSON.stringify({ error: "Invalid input. 'user_id' and 'enable_2fa' are required." }),
                { status: 400 }
            );
        }

        await db.query(
            "UPDATE User SET is_2fa_enabled = ? WHERE user_id = ?",
            [enable_2fa ? 1 : 0, user_id]
        );

        return new Response(
            JSON.stringify({
                message: `2FA ${enable_2fa ? "enabled" : "disabled"} successfully.`,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error toggling 2FA:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    }
}
