import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Comprehensive query to get detailed booking information
    const query = `
      SELECT 
        visit_date, 
        COUNT(*) as visit_count,
        MAX(status) as max_status
      FROM PropertyVisit
      WHERE 
        status IN ('pending', 'approved')
        AND visit_date >= CURRENT_DATE
        AND visit_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
      GROUP BY visit_date
      HAVING visit_count >= 1
    `;

    const [rows] = await db.execute(query);

    // Transform rows into a format with fully booked dates
    const bookedDates = rows.reduce((acc, visit) => {
      const date = new Date(visit.visit_date).toISOString().split('T')[0];
      acc[date] = {
        count: visit.visit_count,
        status: visit.max_status
      };
      return acc;
    }, {});

    return res.status(200).json({ bookedDates });
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });
  }
}