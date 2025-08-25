import { db } from "../../../../lib/db";

export default async function updateConcessionaireBillingfortheMonth(req, res) {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const {
        property_id,
        billingPeriod,
        electricityTotal,
        electricityRate,
        waterTotal,
        waterRate,
    } = req.body;

    if (!property_id || !billingPeriod) {
        return res.status(400).json({ error: "Property ID and Billing Period are required" });
    }

    try {
        const [electricityBill] = await db.query(
            `SELECT bill_id FROM ConcessionaireBilling
             WHERE property_id = ? AND billing_period = ? AND utility_type = 'electricity'`,
            [property_id, billingPeriod]
        );

        if (electricityBill.length > 0) {
            await db.query(
                `UPDATE ConcessionaireBilling 
         SET total_billed_amount = ?, rate_consumed = ?, updated_at = NOW() 
         WHERE bill_id = ?`,
                [electricityTotal, electricityRate, electricityBill[0].bill_id]
            );
        } else {
            return res.status(404).json({ error: "No electricity billing record found for this period" });
        }

        const [waterBill] = await db.query(
            `SELECT bill_id FROM ConcessionaireBilling 
       WHERE property_id = ? AND billing_period = ? AND utility_type = 'water'`,
            [property_id, billingPeriod]
        );

        if (waterBill.length > 0) {
            await db.query(
                `UPDATE ConcessionaireBilling 
         SET total_billed_amount = ?, rate_consumed = ?, updated_at = NOW() 
         WHERE bill_id = ?`,
                [waterTotal, waterRate, waterBill[0].bill_id]
            );
        } else {
            return res.status(404).json({ error: "No water billing record found for this period" });
        }

        return res.status(200).json({ message: "Concessionaire billing updated successfully" });
    } catch (error) {
        console.error("Database Error:", error);
    }
}
