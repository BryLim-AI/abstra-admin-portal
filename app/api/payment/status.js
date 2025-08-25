
import mysql from "mysql2/promise";
// to be dleted.
export default async function paymentSuccessSubscrition(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { requestReferenceNumber, landlord_id, plan_name, amount } = req.body;

    if (!requestReferenceNumber || !landlord_id || !plan_name || !amount) {
        console.error("[ERROR] Missing required parameters:", { requestReferenceNumber, landlord_id, plan_name, amount });
        return res.status(400).json({ error: "Missing required parameters." });
    }

    console.log("[DEBUG] Payment Success - Processing Subscription Update:");
    console.log(" Reference Number:", requestReferenceNumber);
    console.log(" Landlord ID:", landlord_id);
    console.log(" Plan Name:", plan_name);
    console.log(" Amount Paid:", amount);

    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;

    let connection;

    try {
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
        });

        const start_date = new Date().toISOString().split("T")[0];
        const end_date = new Date();
        end_date.setMonth(end_date.getMonth() + 1);
        const formatted_end_date = end_date.toISOString().split("T")[0];


        console.log("Deactivating Previous Subscriptions...");
        await connection.execute(
            "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
            [landlord_id]
        );
        console.log("Previous subscriptions deactivated :", landlord_id);

        console.log("Inserting New Subscription...");
        await connection.execute(
            "INSERT INTO Subscription (landlord_id, plan_name, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, amount_paid, is_active)" +
            " VALUES (?, ?, ?, ?, 'paid', NOW(), ?, 0, ?, 1)",
            [landlord_id, plan_name, start_date, formatted_end_date, requestReferenceNumber, amount]
        );
        console.log("Subscription successfully inserted:", landlord_id);

        await connection.end();
        console.log("Database connection closed.");

        return res.status(200).json({ message: "Subscription activated successfully." });
    } catch (error) {
        console.error("Failed to update subscription:", error.message);
        if (connection) {
            await connection.end();
            console.log("Database connection closed after error.");
        }
        return res.status(500).json({ error: "Failed to update subscription.", details: error.message });
    }
}
