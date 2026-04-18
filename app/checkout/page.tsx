"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";

type CartItem = {
  id: string;
  menuId: string;
  menuName: string;
  basePrice: number;
  qty: number;
  selectedSize: {
    id: string;
    label: string;
    priceDelta: number;
  } | null;
  addOns: {
    id: string;
    label: string;
    priceDelta: number;
    qty: number;
  }[];
  itemTotal: number;
  itemNote?: string | null;
};

const deliverySlots = [
  "11:00 - 11:30",
  "11:30 - 12:00",
  "12:00 - 12:30",
  "12:30 - 13:00",
];

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  if (!mounted) return null;

  const total = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  const handleContinue = async () => {
    if (!customerName || !customerPhone || !roomNo || !deliveryTime) {
      alert("กรุณากรอกข้อมูลลูกค้าให้ครบ");
      return;
    }

    if (cart.length === 0) {
      alert("ไม่มีสินค้าในตะกร้า");
      return;
    }

    try {
      setLoading(true);

      // 1) สร้าง order หลัก
      const orderNo = "RC" + Date.now();

      const { data: createdOrder, error: orderError } = await supabaseClient
        .from("orders")
        .insert({
          order_no: orderNo,
          customer_name: customerName,
          customer_phone: customerPhone,
          room_no: roomNo,
          delivery_round: deliveryTime,
          note,
          subtotal: total,
          total_price: total,
          order_status: "pending_payment",
          payment_status: "unpaid",
        })
        .select()
        .single();

      if (orderError || !createdOrder) {
        console.error("orderError", orderError);
        alert(orderError?.message || "บันทึกคำสั่งซื้อไม่สำเร็จ (orders)");
        return;
      }

      // 2) สร้าง order_items และ order_item_options
      for (const item of cart) {
        const { data: createdItem, error: itemError } = await supabaseClient
          .from("order_items")
          .insert({
            order_id: createdOrder.id,
            menu_id: item.menuId,
            menu_name: item.menuName,
            base_price: item.basePrice,
            qty: item.qty,
            item_note: null,
            item_total: item.itemTotal,
          })
          .select()
          .single();

        if (itemError || !createdItem) {
          console.error("itemError", itemError);
          alert(itemError?.message || "บันทึกรายการสินค้าไม่สำเร็จ (order_items)");
          return;
        }

        const optionsToInsert: {
          order_item_id: string;
          option_name: string;
          option_label: string;
          price_delta: number;
        }[] = [];

        if (item.selectedSize) {
          optionsToInsert.push({
            order_item_id: createdItem.id,
            option_name: "rice_size",
            option_label: item.selectedSize.label,
            price_delta: item.selectedSize.priceDelta,
          });
        }

        if (item.addOns.length > 0) {
          for (const addOn of item.addOns) {
            for (let i = 0; i < addOn.qty; i++) {
              optionsToInsert.push({
                order_item_id: createdItem.id,
                option_name: "add_on",
                option_label: addOn.label,
                price_delta: addOn.priceDelta,
              });
            }
          }
        }

        if (optionsToInsert.length > 0) {
          const { error: optionError } = await supabaseClient
            .from("order_item_options")
            .insert(optionsToInsert);

          if (optionError) {
            console.error("optionError", optionError);
            alert(
              optionError?.message ||
                "บันทึกตัวเลือกสินค้าไม่สำเร็จ (order_item_options)"
            );
            return;
          }
        }
      }

      // 3) เก็บข้อมูล order ไว้ใช้ต่อในหน้า payment / success
      const orderInfo = {
        orderId: createdOrder.id,
        orderNo: createdOrder.order_no,
        customerName,
        customerPhone,
        roomNo,
        deliveryTime,
        note,
        total,
      };

      localStorage.setItem("orderInfo", JSON.stringify(orderInfo));

      // ยังไม่ล้าง cart ตอนนี้ รอให้จบ flow ก่อน
      router.push("/payment");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <h1 className="text-2xl font-bold">สรุปรายการและข้อมูลลูกค้า</h1>

      <div className="mt-6 space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="rounded-xl border p-4">
            <h2 className="text-lg font-semibold">{item.menuName}</h2>

            {item.selectedSize && (
              <p className="text-sm text-gray-600">
                ขนาด: {item.selectedSize.label}
              </p>
            )}

            {item.addOns.length > 0 && (
              <ul className="mt-2 text-sm text-gray-600">
                {item.addOns.map((addOn) => (
                  <li key={addOn.id}>+ {addOn.label}</li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-sm text-gray-600">จำนวน: {item.qty}</p>
            <p className="mt-2 font-bold">{item.itemTotal} บาท</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-gray-100 p-4">
        <p className="text-sm text-gray-600">รวมทั้งหมด</p>
        <p className="text-2xl font-bold">{total} บาท</p>
      </div>

      <div className="mt-8 space-y-3">
        <input
          className="w-full rounded-xl border p-3"
          placeholder="ชื่อ"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <input
          className="w-full rounded-xl border p-3"
          placeholder="เบอร์โทร"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />
        <input
          className="w-full rounded-xl border p-3"
          placeholder="ห้อง"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
        />
        <div className="rounded-2xl border border-black px-5 py-5">
            <p className="text-xl text-gray-500">เลือกรอบเวลารับอาหาร</p>

            <div className="mt-4 space-y-3">
              {deliverySlots.map((slot) => (
                <label
                  key={slot}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-300 p-4"
                >
                  <input
                    type="radio"
                    name="delivery_slot"
                    value={slot}
                    checked={deliveryTime === slot}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                  <span className="text-lg">{slot}</span>
                </label>
              ))}
            </div>
          </div>
        
        <textarea
          className="w-full rounded-xl border p-3"
          placeholder="หมายเหตุ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="mt-6 rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "กำลังบันทึก..." : "ไปชำระเงิน"}
      </button>
    </main>
  );
}