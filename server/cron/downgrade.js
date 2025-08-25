const cron = require("node-cron");
const axios = require("axios");

console.log("Scheduled task to downgrade expired subscriptions.");

// Run every midnight (12:00 AM)
cron.schedule("0 13 * * *", async () => {
    console.log(" Running scheduled check for expired subscriptions...");

    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription/downgrade`);
        console.log("Downgrade API Response:", response.data);
    } catch (error) {
        console.error("Failed to downgrade expired subscriptions:");
        console.error("Status:", error.response?.status || "Unknown");
        console.error("Response:", error.response?.data || "No response");
        console.error("Error message:", error.message);
    }
});

console.log("Subscription downgrade scheduler is running...");
