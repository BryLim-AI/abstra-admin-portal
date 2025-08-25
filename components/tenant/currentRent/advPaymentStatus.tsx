"use client";

import { CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface PaymentStatusProps {
  isPaid: boolean;
  label?: string;
}

export default function PaymentStatus({ isPaid, label = "Status" }: PaymentStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isPaid ? (
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      ) : (
        <InformationCircleIcon className="h-5 w-5 text-amber-500" />
      )}
      <span>
        {label}: <span className={isPaid ? "text-green-600" : "text-yellow-600"}>
          {isPaid ? "Paid" : "Pending"}
        </span>
      </span>
    </div>
  );
}
