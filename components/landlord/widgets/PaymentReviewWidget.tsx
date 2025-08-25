"use client";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
} from "@mui/material";
import useAuthStore from "@/zustand/authStore";

type Payment = {
    payment_id: number;
    tenant_name: string;
    property_name: string;
    amount_paid: number;
    payment_date: string;
    proof_of_payment: string;
    payment_status: "pending" | "confirmed" | "failed";
};

export default function PaymentReviewWidget() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.landlord_id) return;

        fetch(`/api/landlord/payments/getListofPaymentforReview?landlord_id=${user.landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                setPayments(data);
            })
            .catch((err) => console.error("Failed to fetch payments", err));
    }, [user?.landlord_id]);

    const handleAction = async (id: number, action: "approve" | "reject") => {
        try {
            await fetch(`/api/landlord/payments/${id}/${action}`, { method: "POST" });

            setPayments((prev) =>
                prev.map((p) =>
                    p.payment_id === id
                        ? {
                            ...p,
                            payment_status: action === "approve" ? "confirmed" : "failed",
                        }
                        : p
                )
            );
        } catch (err) {
            console.error("Action failed:", err);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow p-4">

            <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
                        <TableRow>
                            <TableCell>Tenant</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Proof</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No pending payments.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.slice(0, 5).map((payment) => (
                                <TableRow key={payment.payment_id}>
                                    <TableCell>{payment.tenant_name || "Unknown"}</TableCell>
                                    <TableCell>₱{payment.amount_paid.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <a
                                            href={payment.proof_of_payment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                src={payment.proof_of_payment}
                                                alt="Proof"
                                                className="h-10 w-10 object-cover rounded"
                                            />
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            sx={{ mr: 1 }}
                                            onClick={() => handleAction(payment.payment_id, "approve")}
                                            disabled={payment.payment_status !== "pending"}
                                        >
                                            ✓
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            onClick={() => handleAction(payment.payment_id, "reject")}
                                            disabled={payment.payment_status !== "pending"}
                                        >
                                            ✗
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {payments.length > 5 && (
                <div className="text-right mt-2">
                    <a
                        href="/landlord/payments/review"
                        className="text-blue-600 hover:underline text-sm"
                    >
                        View all
                    </a>
                </div>
            )}
        </div>
    );
}
