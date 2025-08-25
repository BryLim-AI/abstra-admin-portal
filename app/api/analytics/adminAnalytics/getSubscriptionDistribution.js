import  {db} from "../../../../lib/db";

export default async function SubscriptionDistributions(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const [subscriptionDistribution] = await db.execute(
            `SELECT plan_name, COUNT(*) AS subscriber_count
             FROM Subscription
             WHERE is_active = 1
             GROUP BY plan_name;`
        );

        res.status(200).json(subscriptionDistribution);
    } catch (error) {
        console.error("Error fetching subscription distribution:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}