"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  id: string;
  menuId: string;
  menuName: string;
  basePrice: number;
  qty: number;
  selectedSize: {
    label: string;
    priceDelta: number;
  } | null;
  addOns: {
    label: string;
    priceDelta: number;
    qty: number;
  }[];
  itemTotal: number;
  itemNote?: string | null;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem("cart");
    if (stored) {
      setCart(JSON.parse(stored));
    }
  }, []);

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
  };

  const getUnitPrice = (item: CartItem) => {
    const addOnTotal = (item.addOns ?? []).reduce(
      (sum, addOn) => sum + addOn.priceDelta * addOn.qty,
      0
    );

    return item.basePrice + (item.selectedSize?.priceDelta ?? 0) + addOnTotal;
  };

  const increaseQty = (id: string) => {
    const nextCart = [...cart];
    const targetIndex = nextCart.findIndex((item) => item.id === id);
    if (targetIndex === -1) return;

    const unitPrice = getUnitPrice(nextCart[targetIndex]);
    nextCart[targetIndex].qty += 1;
    nextCart[targetIndex].itemTotal += unitPrice;

    saveCart(nextCart);
  };

  const decreaseQty = (id: string) => {
    const nextCart = [...cart];
    const targetIndex = nextCart.findIndex((item) => item.id === id);
    if (targetIndex === -1) return;

    const unitPrice = getUnitPrice(nextCart[targetIndex]);

    if (nextCart[targetIndex].qty > 1) {
      nextCart[targetIndex].qty -= 1;
      nextCart[targetIndex].itemTotal -= unitPrice;
    } else {
      nextCart.splice(targetIndex, 1);
    }

    saveCart(nextCart);
  };

  if (!mounted) return null;

  const total = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">ตะกร้าของคุณ</h1>

        {cart.length === 0 && (
          <p className="mt-4 text-gray-500">ยังไม่มีรายการ</p>
        )}

        <div className="mt-6 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.menuName}</h2>

                  {item.selectedSize && (
                    <p className="text-sm text-gray-600">
                      ขนาด: {item.selectedSize.label} (+{item.selectedSize.priceDelta} บาท)
                    </p>
                  )}

                  {item.addOns.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600">
                      {item.addOns.map((addOn, index) => (
                        <li key={index}>
                          + {addOn.label} x {addOn.qty} ({addOn.priceDelta * addOn.qty} บาท)
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.itemNote && (
                    <p className="mt-2 text-sm text-gray-600">
                      หมายเหตุ: {item.itemNote}
                    </p>
                  )}

                  {item.selectedSize && (
                    <Link
                      href={`/menu/${item.menuId}?edit=${item.id}`}
                      className="mt-3 inline-block text-sm text-blue-600 underline"
                    >
                      แก้ไขรายการ
                    </Link>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-bold">{item.itemTotal} บาท</p>

                  <div className="mt-3 inline-flex items-center gap-3 rounded-lg border px-3 py-2">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="text-lg font-semibold"
                    >
                      -
                    </button>
                    <span className="min-w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => increaseQty(item.id)}
                      className="text-lg font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-4">
          <p className="text-xl font-bold">รวมทั้งหมด {total} บาท</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="rounded-xl border border-black px-4 py-3 font-medium"
          >
            เลือกเมนูเพิ่ม
          </Link>

          <Link
            href="/checkout"
            className="rounded-xl bg-black px-4 py-3 font-medium text-white"
          >
            ดำเนินการต่อ
          </Link>
        </div>
      </div>
    </main>
  );
}