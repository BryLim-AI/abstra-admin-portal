import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const {
            items,
            firstName,
            lastName,
            email,
            payment_method_id,
            agreement_id,
            redirectUrl,
        } = await req.json();

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
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Invalid request: items array is missing or empty." },
                { status: 400 }
            );
        }

        let totalAmount = 0;
        const mayaItems = [];
        const paymentTypes: string[] = [];

        for (const item of items) {
            if (
                !item.type ||
                !item.amount ||
                isNaN(item.amount) ||
                item.amount <= 0
            ) {
                return NextResponse.json(
                    {
                        error: `Invalid item in 'items' array: ${JSON.stringify(item)}`,
                    },
                    { status: 400 }
                );
            }

            const amountValue = parseFloat(item.amount);
            totalAmount += amountValue;
            paymentTypes.push(item.type);

            mayaItems.push({
                name:
                    item.type === "security_deposit"
                        ? "Security Deposit"
                        : "Advance Rent",
                quantity: 1,
                totalAmount: { value: amountValue, currency: "PHP" },
            });
        }

        if (totalAmount <= 0) {
            return NextResponse.json(
                { error: "Total amount must be greater than zero." },
                { status: 400 }
            );
        }

        const publicKey = process.env.MAYA_PUBLIC_KEY;
        const secretKey = process.env.MAYA_SECRET_KEY;

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
                    `${redirectUrl.success}?agreement_id=${agreement_id}&requestReferenceNumber=${requestReferenceNumber}&status=success&payment_types=${encodedPaymentTypes}&totalAmount=${totalAmount.toFixed(
                        2
                    )}`
                ),
                failure: encodeURI(
                    `${redirectUrl.failure}?agreement_id=${agreement_id}&requestReferenceNumber=${requestReferenceNumber}&status=failed&payment_types=${encodedPaymentTypes}&totalAmount=${totalAmount.toFixed(
                        2
                    )}`
                ),
                cancel: encodeURI(
                    `${redirectUrl.cancel}?agreement_id=${agreement_id}&requestReferenceNumber=${requestReferenceNumber}&status=cancelled&payment_types=${encodedPaymentTypes}&totalAmount=${totalAmount.toFixed(
                        2
                    )}`
                ),
            },
            requestReferenceNumber,
            items: mayaItems,
        };

        console.log("Sending Payload to Maya:", JSON.stringify(payload, null, 2));

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

        console.log("Maya Response:", response.data);

        return NextResponse.json({
            checkoutUrl: response.data.redirectUrl,
            requestReferenceNumber,
        });
    } catch (error: any) {
        console.error(
            "Error during Maya payment processing:",
            error.response?.data || error.message
        );
        return NextResponse.json(
            {
                error: "Payment initiation failed.",
                details: error.response?.data || error.message,
            },
            { status: 500 }
        );
    }
}
