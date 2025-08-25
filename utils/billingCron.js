import { db } from "../lib/db";
import cron from "node-cron";

async function sendBillingNotifications() {
    try {

        const [bills] = await db.execute(`
            SELECT
                b.billing_id,
                b.unit_id,
                b.total_amount_due,
                b.due_date,
                t.user_id  
            FROM Billing b
                     JOIN LeaseAgreement la ON b.unit_id = la.unit_id
                     JOIN Tenant t ON la.tenant_id = t.tenant_id 
            WHERE b.status = 'unpaid'
              AND b.due_date = CURDATE() + INTERVAL 7 DAY
        `);

        if (bills.length === 0) {
            console.log("No upcoming bills within the next 7 days.");
            return;
        }

        const notifications = bills.map(bill => `('${bill.tenant_id}', 'Billing Reminder', 
            'Your billing payment of ₱${bill.total_amount_due} is due on ${bill.due_date}. Please pay on time.', 0, NOW())`).join(",");

        await db.execute(`INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES ${notifications}`);

        console.log(`Sent ${bills.length} billing reminders.`);

    } catch (error) {
        console.error("Error sending billing notifications:", error);
    }
}
// Ervy 12 mn.
cron.schedule("0 0 * * *", async () => {
    console.log("Running billing notification cron job...");
    await sendBillingNotifications();
});

export default sendBillingNotifications;