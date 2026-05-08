"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";

type Props = {
  orderId: string;
  paymentStatus: string | null;
  orderStatus: string | null;
};

export default function AdminOrderActions({
  orderId,
  paymentStatus,
  orderStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateOrder = async (payload: {
    payment_status?: string;
    order_status?: string;
  }) => {
    try {
      setLoading(true);

      const { error } = await supabaseClient
        .from("orders")
        .update(payload)
        .eq("id", orderId);

      if (error) {
        toast.error(error.message || "อัปเดตสถานะไม่สำเร็จ");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        disabled={loading}
        onClick={() =>
          updateOrder({
            payment_status: "paid",
            order_status: "confirmed",
          })
        }
        className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        ยืนยันชำระเงิน
      </button>

      <button
        disabled={loading}
        onClick={() =>
          updateOrder({
            order_status: "cooking",
          })
        }
        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
      >
        กำลังทำ
      </button>

      <button
        disabled={loading}
        onClick={() =>
          updateOrder({
            order_status: "done",
          })
        }
        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
      >
        เสร็จแล้ว
      </button>

      <div className="ml-auto text-sm text-gray-500">
        payment: {paymentStatus || "-"} | order: {orderStatus || "-"}
      </div>
    </div>
  );
}