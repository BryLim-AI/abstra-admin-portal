import { checkExpiringLeases } from "../../../utils/leaseCron";

export default async function handler(req, res) {
  if (req.method === "POST" || req.method === "GET") {
    try {
      console.log("checkExpiringLease triggered.");
      await checkExpiringLeases();
      console.log("checkExpiringLease finished successfully.");
      res
        .status(200)
        .json({ message: "Lease expiration check completed successfully." });
    } catch (error) {
      console.error("API Error checking lease expirations:", error);
      res.status(500).json({
        error: "Failed to check lease expirations.",
        details: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
