import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const [rows] = await db.execute(
        "SELECT method_id, method_name FROM PaymentMethod"
      );

      return res.status(200).json({ success: true, paymentMethods: rows });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}
