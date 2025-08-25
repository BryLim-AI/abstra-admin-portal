import cron from "node-cron";
import { checkExpiringLeases } from "../../src/utils/leaseCron";

// Run every midnight (12:00 AM)
cron.schedule("0 0 * * *", async () => {
  console.log("Cron job triggered: Running checkExpiringLeases...");

  await checkExpiringLeases();
});
