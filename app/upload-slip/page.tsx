"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";

type OrderInfo = {
  orderId: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  roomNo: string;
  deliveryTime: string;
  note: string;
  total: number;
};

export default function UploadSlipPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      alert("กรุณาเลือกไฟล์สลิป");
      return;
    }

    const storedOrderInfo = localStorage.getItem("orderInfo");
    if (!storedOrderInfo) {
      alert("ไม่พบข้อมูลคำสั่งซื้อ");
      return;
    }

    const orderInfo: OrderInfo = JSON.parse(storedOrderInfo);

    try {
      setLoading(true);

      const fileExt = file.name.split(".").pop();
      const filePath = `${orderInfo.orderId}/${Date.now()}.${fileExt}`;

      // 1) upload file to storage
      const { error: uploadError } = await supabaseClient.storage
        .from("payment-slips")
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) {
        console.error("uploadError", uploadError);
        alert(uploadError.message || "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }

      // 2) get public url
      const { data: publicUrlData } = supabaseClient.storage
        .from("payment-slips")
        .getPublicUrl(filePath);

      const slipUrl = publicUrlData.publicUrl;

      // 3) update order
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({
          slip_url: slipUrl,
          payment_status: "waiting_review",
        })
        .eq("id", orderInfo.orderId);

      if (updateError) {
        console.error("updateError", updateError);
        alert(updateError.message || "อัปเดตคำสั่งซื้อไม่สำเร็จ");
        return;
      }

      router.push("/success");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <h1 className="text-2xl font-bold">อัปโหลดสลิป</h1>

      <div className="mt-6">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
              setFile(selectedFile);
              setFileName(selectedFile.name);
            }
          }}
        />
      </div>

      {fileName && (
        <p className="mt-3 text-sm text-gray-600">ไฟล์ที่เลือก: {fileName}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "กำลังอัปโหลด..." : "ยืนยันการส่งสลิป"}
      </button>
    </main>
  );
}