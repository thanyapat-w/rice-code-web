"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";

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

export default function PaymentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedOrderInfo =
      localStorage.getItem("orderInfo") ||
      localStorage.getItem("checkoutData");

    if (storedOrderInfo) {
      setOrderInfo(JSON.parse(storedOrderInfo));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmSlip = async () => {
    if (!selectedFile) {
      toast("กรุณาเลือกไฟล์สลิป");
      return;
    }

    if (!orderInfo?.orderId) {
      toast("ไม่พบข้อมูลคำสั่งซื้อ");
      return;
    }

    try {
      setLoading(true);

      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${orderInfo.orderId}/${Date.now()}.${fileExt}`;

      // 1) upload file to storage
      const { error: uploadError } = await supabaseClient.storage
        .from("payment-slips")
        .upload(filePath, selectedFile, {
          upsert: false,
        });

      if (uploadError) {
        console.error("uploadError", uploadError);
        toast.error(uploadError.message || "อัปโหลดสลิปไม่สำเร็จ");
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
        toast.error(updateError.message || "อัปเดตคำสั่งซื้อไม่สำเร็จ");
        return;
      }

      router.push("/success");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  if (!orderInfo) {
    return (
      <main className="p-6">
        <p>ไม่พบข้อมูลออเดอร์</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">ชำระเงิน</h1>

        <div className="mt-6 rounded-xl border p-4">
          <p className="text-sm text-gray-600">ยอดที่ต้องชำระ</p>
          <p className="text-2xl font-bold">{orderInfo.total} บาท</p>
        </div>

        <div className="mt-4 rounded-xl bg-yellow-100 p-4 text-sm text-yellow-800">
          ⚠️ โหมดทดสอบ: ยังไม่ต้องโอนเงินจริง  
          กรุณาอัปโหลดรูปอะไรก็ได้เพื่อทดสอบระบบ
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-gray-100 p-4">
          <img
            src="/promptpay_qr.jpg"
            alt="PromptPay QR"
            className="mx-auto max-h-[420px] w-full object-contain"
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>PromptPay: 08X-XXX-XXXX</p>
          <p>ชื่อบัญชี: Rice Code</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-6">
          <button
            type="button"
            onClick={handleChooseFile}
            className="rounded-xl bg-black px-4 py-3 text-white"
          >
            {selectedFile ? "เปลี่ยนสลิป" : "อัปโหลดสลิป"}
          </button>
        </div>

        {previewUrl && (
          <div className="mt-6 rounded-2xl border p-4">
            <p className="mb-3 text-sm text-gray-600">
              ตรวจสอบสลิปก่อนยืนยัน
            </p>
            <img
              src={previewUrl}
              alt="Slip preview"
              className="mx-auto max-h-[480px] w-full rounded-lg object-contain"
            />
            <p className="mt-3 text-sm text-gray-600">
              ไฟล์ที่เลือก: {selectedFile?.name}
            </p>
          </div>
        )}

        {selectedFile && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleConfirmSlip}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
            >
              {loading ? "กำลังยืนยัน..." : "ยืนยันการส่งสลิป"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}