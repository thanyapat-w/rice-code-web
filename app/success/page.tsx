"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderInfo = {
  orderId?: string;
  orderNo?: string;
  customerName: string;
  customerPhone: string;
  roomNo: string;
  deliveryTime: string;
  note: string;
  total: number;
};

export default function SuccessPage() {
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);

  useEffect(() => {
    const storedOrderInfo =
      localStorage.getItem("orderInfo") ||
      localStorage.getItem("checkoutData");

    if (storedOrderInfo) {
      setOrderInfo(JSON.parse(storedOrderInfo));
    }

    // ล้างข้อมูลหลังอ่านเสร็จ
    localStorage.removeItem("cart");
    localStorage.removeItem("orderInfo");
    localStorage.removeItem("checkoutData");
    localStorage.removeItem("selectedSlipName");
  }, []);

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">สั่งซื้อสำเร็จ 🎉</h1>
        <p className="mt-4 text-lg">ระบบได้รับคำสั่งซื้อของคุณแล้ว</p>

        {orderInfo && (
          <div className="mt-6 rounded-xl border p-6">
            <p className="text-lg">
              <span className="font-semibold">ชื่อ:</span>{" "}
              {orderInfo.customerName}
            </p>
            <p className="mt-2 text-lg">
              <span className="font-semibold">เบอร์:</span>{" "}
              {orderInfo.customerPhone}
            </p>
            <p className="mt-2 text-lg">
              <span className="font-semibold">ห้อง:</span> {orderInfo.roomNo}
            </p>
            <p className="mt-2 text-lg">
              <span className="font-semibold">เวลารับอาหาร:</span>{" "}
              {orderInfo.deliveryTime}
            </p>
            {orderInfo.note && (
              <p className="mt-2 text-lg">
                <span className="font-semibold">หมายเหตุ:</span>{" "}
                {orderInfo.note}
              </p>
            )}
            <p className="mt-4 text-2xl font-bold">
              ยอดรวม: {orderInfo.total} บาท
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-black px-5 py-3 text-white"
        >
          กลับหน้าเมนู
        </Link>
      </div>
    </main>
  );
}