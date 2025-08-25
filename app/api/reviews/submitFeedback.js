import { db } from "../../../lib/db";

export default async function submitFeedback(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { landlord_id, review_id, feedback_text } = req.body;

  if (!landlord_id || !review_id || !feedback_text) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const query = `
        INSERT INTO Feedback (landlord_id, review_id, feedback_text, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())`;

    await db.execute(query, [landlord_id, review_id, feedback_text]);

    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
