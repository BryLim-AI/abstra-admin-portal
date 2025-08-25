import mysql from "mysql2/promise";

export default async function billingFailedPayment(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { tenant_id, requestReferenceNumber, amount, billing_id } = req.body;

        if (!tenant_id || !requestReferenceNumber || !amount) {
            return res.status(400).json({ message: "Missing required fields." });
        }

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

            const [activeLease] = await connection.execute(
                `SELECT agreement_id FROM LeaseAgreement 
                 WHERE tenant_id = ? AND status = 'active' 
                 LIMIT 1`,
                [tenant_id]
            );

            if (activeLease.length === 0) {
                await connection.end();
                return res.status(404).json({ message: "No active lease found for this tenant." });
            }

            const { agreement_id } = activeLease[0];

            const [existingPayment] = await connection.execute(
                `SELECT * FROM Payment WHERE receipt_reference = ? LIMIT 1`,
                [requestReferenceNumber]
            );

            if (existingPayment.length > 0) {
                await connection.end();
                return res.status(400).json({ message: "Payment already recorded." });
            }

            await connection.execute(
                `INSERT INTO Payment (agreement_id, payment_type, amount_paid, payment_method_id, payment_status, receipt_reference, created_at)
                 VALUES (?, ?, ?, ?, 'cancelled', ?, NOW())`,
                [agreement_id, "billing", amount, 1, requestReferenceNumber]
            );

            await connection.execute(
                `UPDATE Billing 
                 SET status = 'unpaid', paid_at = NOW(), updated_at = NOW() 
                 WHERE billing_id = ?`,
                [billing_id]
            );

            await connection.end();

            return res.status(200).json({
                message: `Payment for Monthly Billing recorded successfully.`,
                tenant_id,
                agreement_id,
                requestReferenceNumber,
            });

        } catch (dbError) {
            if (connection) await connection.end();
            return res.status(500).json({ message: "Database Error", error: dbError.message });
        }

    } catch (error) {
        console.error("Error processing payment success:", error);
    }
}
