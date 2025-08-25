import { db } from "../../../../lib/db";

export default async function getPlatformUserDistributions(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const [userDistribution] = await db.execute(
      `SELECT userType, COUNT(*) AS user_count
             FROM User
             WHERE status = 'active'
             GROUP BY userType;`
    );

    res.status(200).json(userDistribution);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
