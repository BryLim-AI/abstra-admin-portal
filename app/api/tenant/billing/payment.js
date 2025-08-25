
import { db } from "../../../../lib/db";
//  fetch the active lease agreement using the tenant_id.
import axios from "axios";

export default async function tenantPaymentBilling(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const {
        tenant_id,
        amount,
        firstName,
        lastName,
        email,
        payment_method_id,
        redirectUrl,
        billing_id
    } = req.body;

    console.log("Payment Request Received:", { tenant_id, amount, firstName, lastName, email, payment_method_id, redirectUrl });

    const [activeLease] = await db.execute(
        `SELECT agreement_id FROM LeaseAgreement 
         WHERE tenant_id = ? AND status = 'active' 
         LIMIT 1`,
        [tenant_id]
    );

    if (activeLease.length === 0) {
        return res.status(404).json({ error: "No active lease found for this tenant." });
    }

    const { agreement_id } = activeLease[0];

    if (!amount || isNaN(amount) || !payment_method_id || !agreement_id || !firstName || !lastName || !email) {
        return res.status(400).json({ error: "Invalid request parameters. Check required fields." });
    }

    const publicKey = process.env.MAYA_PUBLIC_KEY;
    const secretKey = process.env.MAYA_SECRET_KEY;

    try {
        // Generate Unique Receipt Reference
        const requestReferenceNumber = `PAYBILL-${Date.now()}`;

        const payload = {
            totalAmount: { value: parseFloat(amount), currency: "PHP" },
            buyer: { firstName, lastName, contact: { email } },
            redirectUrl: {
                success: encodeURI(`${redirectUrl.success}?&tenant_id=${tenant_id}&billing_id=${billing_id}&amount=${amount}&requestReferenceNumber=${requestReferenceNumber}`),
                failure: encodeURI(`${redirectUrl.failure}?&tenant_id=${tenant_id}&billing_id=${billing_id}&amount=${amount}&requestReferenceNumber=${requestReferenceNumber}`),
                cancel: encodeURI(`${redirectUrl.cancel}?&tenant_id=${tenant_id}&billing_id=${billing_id}&amount=${amount}&requestReferenceNumber=${requestReferenceNumber}`),
            },
            requestReferenceNumber,
            items: [{
                name: "Monthly Billing",
                quantity: 1,
                totalAmount: { value: parseFloat(amount), currency: "PHP" },
            }],
        };

        console.log("Sending Payload to Maya:", JSON.stringify(payload, null, 2));

        const response = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            payload,
            { headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}` } }
        );

        console.log("Maya Response:", response.data);

        return res.status(200).json({
            checkoutUrl: response.data.redirectUrl,
            requestReferenceNumber
        });

    } catch (error) {
        console.error("Error during Maya payment processing:", error.response?.data || error.message);
        return res.status(500).json({ error: "Payment initiation failed.", details: error.response?.data || error.message });
    }
}

