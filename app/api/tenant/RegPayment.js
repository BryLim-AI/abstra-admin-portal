import axios from "axios";

export default async function tenantPayment(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    items,
    firstName,
    lastName,
    email,
    payment_method_id,
    agreement_id,
    redirectUrl,
  } = req.body;

  console.log("Multi-Item Payment Request:", {
    items,
    firstName,
    lastName,
    email,
    payment_method_id,
    agreement_id,
    redirectUrl,
  });

  if (
    !agreement_id ||
    !firstName ||
    !lastName ||
    !email ||
    !payment_method_id
  ) {
    return res.status(400).json({
      error: "Missing required fields.",
    });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid request: items array is missing or empty." });
  }

  let totalAmount = 0;
  const mayaItems = [];
  const paymentTypes = [];

  for (const item of items) {
    if (!item.type || !item.amount || isNaN(item.amount) || item.amount <= 0) {
      return res.status(400).json({
        error: `Invalid item found in 'items' array: ${JSON.stringify(item)}`,
      });
    }
    const amountValue = parseFloat(item.amount);
    totalAmount += amountValue;
    paymentTypes.push(item.type);

    mayaItems.push({
      name:
        item.type === "security_deposit" ? "Security Deposit" : "Advance Rent",
      quantity: 1,
      totalAmount: { value: amountValue, currency: "PHP" },
    });
  }

  if (totalAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Total amount must be greater than zero." });
  }

  const publicKey = process.env.MAYA_PUBLIC_KEY;
  const secretKey = process.env.MAYA_SECRET_KEY;

  try {
    const requestReferenceNumber = `PAYMULTI-${Date.now()}-${agreement_id}`;
    const encodedPaymentTypes = encodeURIComponent(paymentTypes.join(","));

    const payload = {
      totalAmount: {
        value: parseFloat(totalAmount.toFixed(2)),
        currency: "PHP",
      },
      buyer: { firstName, lastName, contact: { email } },
      redirectUrl: {
        success: encodeURI(
          `${
            redirectUrl.success
          }?agreement_id=${agreement_id}&requestReferenceNumber=${requestReferenceNumber}&status=success&payment_types=${encodedPaymentTypes}&totalAmount=${totalAmount.toFixed(
            2
          )}`
        ),
        failure: encodeURI(
          `${
            redirectUrl.failure
          }?agreement_id=${agreement_id}&requestReferenceNumber=${requestReferenceNumber}&status=failed&payment_types=${encodedPaymentTypes}&totalAmount=${totalAmount.toFixed(
            2
          )}`
        ),
        cancel: encodeURI(
          `${
            redirectUrl.cancel
          }?agreement_id=${agreement_id}&requestReferenceNumber=${requestReferenceNumber}&status=cancelled&payment_types=${encodedPaymentTypes}&totalAmount=${totalAmount.toFixed(
            2
          )}`
        ),
      },
      requestReferenceNumber,
      items: mayaItems,
    };

    console.log("Sending Payload to Maya:", JSON.stringify(payload, null, 2));

    //region MAYA PAYMENT GATWATY
    const response = await axios.post(
      "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${publicKey}:${secretKey}`
          ).toString("base64")}`,
        },
      }
    );
    //endregion

    console.log("Maya Response:", response.data);

    return res.status(200).json({
      checkoutUrl: response.data.redirectUrl,
      requestReferenceNumber,
    });
  } catch (error) {
    console.error(
      "Error during Maya payment processing:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      error: "Payment initiation failed.",
      details: error.response?.data || error.message,
    });
  }
}
