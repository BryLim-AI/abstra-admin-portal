
import axios from "axios";
import mysql from "mysql2/promise";

// to be deleted.
export default async function subscriptionCheckout(req, res) {

    const { amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name } = req.body;

    if (!landlord_id) {
        return res.status(400).json({ error: "Missing landlord_id in request." });
    }

    console.log("Incoming Request Data for subscription checkout:", {
        amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name
    });

    const publicKey = process.env.MAYA_PUBLIC_KEY;
    const secretKey = process.env.MAYA_SECRET_KEY;
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

        // Check if trial has already been used (tracked at user level) efined.
        const [landlordData] = await connection.execute(
            "SELECT is_trial_used FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        const hasUsedTrial = landlordData.length > 0 && landlordData[0].is_trial_used;
        console.log("Debug - Has Used Trial Before?", hasUsedTrial);

        //  Determine Trial Days Based on Plan
        const start_date = new Date().toISOString().split("T")[0];
        const trialDays = plan_name === "Standard" ? 10 : plan_name === "Premium" ? 10 : 14;
        const trialStartDate = new Date(start_date);
        const trialEndDate = new Date(trialStartDate);
        trialEndDate.setDate(trialStartDate.getDate() + trialDays);
        const formattedTrialEndDate = trialEndDate.toISOString().split("T")[0];

        const end_date = new Date();
        end_date.setMonth(end_date.getMonth() + 1);
        const formatted_end_date = end_date.toISOString().split("T")[0];

        //  **If trial has NOT been used before allow trial mode

        if (!hasUsedTrial && (plan_name === "Standard" || plan_name === "Premium")) {
            console.log("Granting One-Time Free Trial!");

            await connection.execute(
                "UPDATE Landlord SET is_trial_used = 1 WHERE landlord_id = ?",
                [landlord_id]
            );

            const [existingSubscription] = await connection.execute(
                "SELECT subscription_id FROM Subscription WHERE landlord_id = ? LIMIT 1",
                [landlord_id]
            );

            if (existingSubscription.length > 0) {
                await connection.execute(
                    "UPDATE Subscription SET plan_name = ?, status = 'trial', start_date = ?, end_date = ?, payment_status = 'pending', is_trial = 1, trial_end_date = ? WHERE landlord_id = ?",
                    [plan_name, start_date, formattedTrialEndDate, formattedTrialEndDate, landlord_id]
                );
            } else {
                await connection.execute(
                    "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)",
                    [
                        landlord_id,
                        plan_name,
                        "trial",
                        start_date,
                        formattedTrialEndDate,
                        "pending",
                        `TRIAL-${Date.now()}`,
                        1, // Mark as trial
                        formattedTrialEndDate,
                    ]
                );
            }

            await connection.end();
            return res.status(201).json({
                message: "Free trial activated successfully.",
                trialEndDate: formattedTrialEndDate,
                subscriptionEndDate: formattedTrialEndDate,
            });
        }

        // If the user has already used the trial, proceed to payment
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: "Invalid amount." });
        }

        const requestReferenceNumber = `REF-${Date.now()}`;

// maya
        const payload = {
            totalAmount: { value: amount, currency: "PHP" },
            buyer: { firstName, lastName, contact: { email } },
            redirectUrl: {
                success: `${redirectUrl.success}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${encodeURIComponent(landlord_id)}&plan_name=${encodeURIComponent(plan_name)}&amount=${encodeURIComponent(amount)}`,
                failure: `${redirectUrl.failure}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${landlord_id}`,
                cancel: `${redirectUrl.cancel}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${landlord_id}`,
            },
            requestReferenceNumber,
            items: [{ name: description, quantity: 1, totalAmount: { value: amount, currency: "PHP" } }],
        };

        const response = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            payload,
            { headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}` } }
        );

        await connection.end();

        return res.status(200).json({
            checkoutUrl: response.data.redirectUrl,
            requestReferenceNumber,
            landlord_id,
            subscriptionEndDate: formatted_end_date,
            payload,
        });

    } catch (error) {
        console.error("Error during Maya checkout:", error.message);
        if (connection) await connection.end();
        return res.status(500).json({ error: "Payment initiation failed.", details: error.response?.data || error.message });
    }
}