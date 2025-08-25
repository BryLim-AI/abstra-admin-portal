import mysql from "mysql2/promise";

export default async function cancelLeasePayment(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { agreement_id, paymentTypes, requestReferenceNumber, totalAmount } =
      req.body;

    if (
      !agreement_id ||
      !paymentTypes ||
      !requestReferenceNumber ||
      !totalAmount
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;

    let connection;

    try {
      connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      });

      await connection.beginTransaction();

      const checkExistingSql = `SELECT payment_id FROM Payment WHERE receipt_reference = ? AND payment_status = 'confirmed'`;
      const [existingPayments] = await connection.execute(checkExistingSql, [
        requestReferenceNumber,
      ]);

      if (existingPayments.length > 0) {
        const [alreadyConfirmedDetails] = await connection.execute(
          `SELECT payment_type, amount_paid FROM Payment WHERE receipt_reference = ? AND payment_status = 'confirmed'`,
          [requestReferenceNumber]
        );
        const confirmedItems = alreadyConfirmedDetails.map(
          (p) => p.payment_type
        );
        const totalConfirmed = alreadyConfirmedDetails.reduce(
          (sum, p) => sum + parseFloat(p.amount_paid || 0),
          0
        );

        return res.status(200).json({
          message: `Payment already recorded for reference: ${requestReferenceNumber}.`,
          processed: true,
          requestReferenceNumber,
          confirmedItems: confirmedItems,
          totalAmountConfirmed: totalConfirmed.toFixed(2),
        });
      }
      console.log(
        `No existing confirmed payment found for ${requestReferenceNumber}. Proceeding to record.`
      );

      const getLeaseDetailsSql = `
            SELECT la.is_security_deposit_paid, la.is_advance_payment_paid, u.sec_deposit, u.advanced_payment
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            WHERE la.agreement_id = ?
        `;
      const [leaseDetails] = await connection.execute(getLeaseDetailsSql, [
        agreement_id,
      ]);

      if (leaseDetails.length === 0) {
        throw new Error(
          `Could not find lease agreement details for ID: ${agreement_id}`
        );
      }
      const lease = leaseDetails[0];

      let itemsActuallyRecorded = [];
      let paymentInserts = []; // Array to hold data for bulk insert
      let leaseUpdateClauses = []; // Array to hold "column = 1" strings
      let calculatedTotalRecorded = 0;

      // Loop through each item type that was supposedly paid (e.g., 'security_deposit', 'advance_rent')
      for (const paymentType of paymentTypes) {
        let amountToRecord = 0;
        let isItemAlreadyPaid = false;
        let columnName = null;

        // Determine amount and status based on the type
        if (paymentType === "security_deposit") {
          amountToRecord = parseFloat(lease.sec_deposit || 0);
          isItemAlreadyPaid = !!lease.is_security_deposit_paid;
          columnName = "is_security_deposit_paid";
        } else if (paymentType === "advance_rent") {
          amountToRecord = parseFloat(lease.advanced_payment || 0);
          isItemAlreadyPaid = !!lease.is_advance_payment_paid;
          columnName = "is_advance_payment_paid";
        } else {
          console.warn(
            `Unknown item type encountered: ${paymentType}. Skipping.`
          );
          continue;
        }

        if (amountToRecord > 0 && !isItemAlreadyPaid) {
          // Prepare data for bulk INSERT into Payment table
          paymentInserts.push([
            agreement_id,
            paymentType,
            amountToRecord,
            1,
            "failed",
            requestReferenceNumber,
            new Date(),
            new Date(),
            new Date(),
          ]);

          leaseUpdateClauses.push(`\`${columnName}\` = 0`);

          itemsActuallyRecorded.push(paymentType);
          calculatedTotalRecorded += amountToRecord;
        }
      }

      let leaseUpdated = false;
      if (paymentInserts.length > 0) {
        // Bulk Insert into Payment table
        const insertPaymentSql = `
                INSERT INTO Payment
                    (agreement_id, payment_type, amount_paid, payment_method_id, payment_status,
                     receipt_reference, payment_date, created_at, updated_at)
                VALUES ?`;
        await connection.query(insertPaymentSql, [paymentInserts]);

        if (leaseUpdateClauses.length > 0) {
          const setClause = leaseUpdateClauses.join(", ");
          const updateLeaseSql = `UPDATE LeaseAgreement SET ${setClause}, updated_at = NOW() WHERE agreement_id = ?`;
          const [updateResult] = await connection.execute(updateLeaseSql, [
            agreement_id,
          ]);
          if (updateResult.affectedRows > 0) {
            leaseUpdated = true;
            console.log(`LeaseAgreement updated successfully.`);
          } else {
            console.warn(
              `LeaseAgreement update affected 0 rows for ID: ${agreement_id}`
            );
          }
        }
      } else {
        console.log("No new items to record.");
      }

      await connection.commit();

      return res.status(200).json({
        message: `Payment recorded successfully for: ${
          itemsActuallyRecorded.join(", ") ||
          (existingPayments.length > 0
            ? "payment already processed"
            : "items already paid")
        }. ${leaseUpdated ? "Lease updated." : ""}`,
        processed: true,
        requestReferenceNumber,
        confirmedItems: itemsActuallyRecorded,
        totalAmountConfirmed: calculatedTotalRecorded.toFixed(2),
      });
    } catch (dbError) {
      if (connection) await connection.end();
      return res
        .status(500)
        .json({ message: "Database Error", error: dbError.message });
    }
  } catch (error) {
    return res.status(500).json({ message: `DB Server Error ${error}` });
  }
}
