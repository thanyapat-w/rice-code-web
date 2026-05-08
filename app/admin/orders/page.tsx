export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminOrderActions from "@/components/AdminOrderActions";

type Order = {
  id: string;
  order_no: string;
  customer_name: string | null;
  customer_phone: string | null;
  room_no: string | null;
  delivery_round: string | null;
  note: string | null;
  subtotal: number | null;
  total_price: number | null;
  order_status: string | null;
  payment_status: string | null;
  slip_url: string | null;
  created_at: string | null;
};

type OrderItem = {
  id: string;
  order_id: string;
  menu_id: string | null;
  menu_name: string | null;
  base_price: number | null;
  qty: number | null;
  item_note: string | null;
  item_total: number | null;
  created_at: string | null;
};

type OrderItemOption = {
  id: string;
  order_item_id: string;
  option_name: string;
  option_label: string;
  price_delta: number;
  create_at?: string | null;
};

export default async function AdminOrdersPage() {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*");

  const { data: orderItemOptions, error: optionsError } = await supabase
    .from("order_item_options")
    .select("*");

  if (ordersError || itemsError || optionsError) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Admin Orders</h1>
        <p className="mt-4 text-red-600">โหลดข้อมูลไม่สำเร็จ</p>
        <pre className="mt-4 text-sm">
          {JSON.stringify(
            {
              ordersError,
              itemsError,
              optionsError,
            },
            null,
            2
          )}
        </pre>
      </main>
    );
  }

  const ordersList = (orders ?? []) as Order[];
  const itemsList = (orderItems ?? []) as OrderItem[];
  const optionsList = (orderItemOptions ?? []) as OrderItemOption[];

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Orders</h1>
        <Link href="/" className="rounded-lg border px-4 py-2 text-sm">
          กลับหน้าเมนู
        </Link>
      </div>

      <div className="space-y-6">
        {ordersList.map((order) => {
          const items = itemsList.filter((item) => item.order_id === order.id);

          return (
            <section key={order.id} className="rounded-2xl border p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {order.order_no || order.id}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    ลูกค้า: {order.customer_name || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    เบอร์: {order.customer_phone || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    ห้อง: {order.room_no || "-"}
                  </p>
                  <p className="text-sm text-gray-600">
                    เวลารับ: {order.delivery_round || "-"}
                  </p>
                  {order.note && (
                    <p className="mt-2 text-sm text-gray-700">
                      หมายเหตุ: {order.note}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">ยอดรวม</p>
                  <p className="text-2xl font-bold">
                    {order.total_price ?? 0} บาท
                  </p>

                  {order.slip_url ? (
                    <a
                      href={order.slip_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block rounded-lg border px-3 py-2 text-sm"
                    >
                      เปิดสลิป
                    </a>
                  ) : (
                    <p className="mt-3 text-sm text-red-500">ยังไม่มีสลิป</p>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <h3 className="font-semibold">รายการสินค้า</h3>

                <div className="mt-3 space-y-3">
                  {items.map((item) => {
                    const itemOptions = optionsList.filter(
                      (option) => option.order_item_id === item.id
                    );

                    return (
                      <div key={item.id} className="rounded-xl border bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.menu_name}</p>
                            <p className="text-sm text-gray-600">
                              จำนวน: {item.qty ?? 1}
                            </p>

                            {itemOptions.length > 0 && (
                              <ul className="mt-2 text-sm text-gray-600">
                                {itemOptions.map((option) => (
                                  <li key={option.id}>
                                    - {option.option_name}: {option.option_label} (
                                    +{option.price_delta} บาท)
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="text-right font-semibold">
                            {item.item_total ?? 0} บาท
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <p className="text-sm text-gray-500">ยังไม่มีรายการสินค้า</p>
                  )}
                </div>
              </div>

              <AdminOrderActions
                orderId={order.id}
                paymentStatus={order.payment_status}
                orderStatus={order.order_status}
              />
            </section>
          );
        })}

        {ordersList.length === 0 && (
          <p className="text-gray-500">ยังไม่มีคำสั่งซื้อ</p>
        )}
      </div>
    </main>
  );
}