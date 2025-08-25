import mysql from "mysql2/promise";
// THIS IS A CRON JOB.
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed. ONLY POST" });
    }
    console.log("Checking for expired subscriptions...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const today = new Date().toISOString().split("T")[0];

        const [expiredSubscriptions] = await connection.execute(
            "SELECT landlord_id FROM Subscription WHERE end_date < ? AND is_active = 1",
            [today]
        );

        if (expiredSubscriptions.length === 0) {
            console.log("No expired subscriptions found.");
            await connection.end();
            return res.status(200).json({ message: "No expired subscriptions found." });
        }

        console.log(`Downgrading ${expiredSubscriptions.length} expired subscriptions...`);

        for (const { landlord_id } of expiredSubscriptions) {
            await connection.execute(
                "UPDATE Subscription SET plan_name = 'Free Plan', is_active = 1, is_trial = 0, start_date= NOW(), end_date=0, payment_status = 'paid', updated_at = NOW() WHERE landlord_id = ?",
                [landlord_id]
            );
            console.log(`Sent downgrade notification to landlord_id: ${landlord_id}`);
        }

        await connection.end();
        return res.status(200).json({ message: "Downgraded expired subscriptions successfully." });

    } catch (error) {
        console.error("Error downgrading expired subscriptions:", error);
        return res.status(500).json({ error: "Failed to downgrade expired subscriptions.", details: error.message });
    }
}
