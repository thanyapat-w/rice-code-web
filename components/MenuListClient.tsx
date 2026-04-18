"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Menu = {
  id: string;
  name: string;
  category: string;
  base_price: number;
  description: string | null;
  is_active: boolean;
  has_options: boolean | null;
  image_url: string | null;
};

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
    qty?: number;
  }[];
  itemTotal: number;
};

type Props = {
  menus: Menu[];
};

export default function MenuListClient({ menus }: Props) {
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

  const isSimpleVariant = (menu: Menu, item: CartItem) => {
    if (item.menuId !== menu.id) return false;
    return !item.selectedSize && (item.addOns ?? []).length === 0;
  };

  const getMenuQty = (menuId: string) => {
    return cart
      .filter((item) => item.menuId === menuId)
      .reduce((sum, item) => sum + item.qty, 0);
  };

  const getSimpleMenuQty = (menu: Menu) => {
    return cart
      .filter((item) => isSimpleVariant(menu, item))
      .reduce((sum, item) => sum + item.qty, 0);
  };

  const handleQuickAdd = (menu: Menu) => {
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      menuId: menu.id,
      menuName: menu.name,
      basePrice: menu.base_price,
      qty: 1,
      selectedSize: null,
      addOns: [],
      itemTotal: menu.base_price,
    };

    const nextCart = [...cart];
    const index = nextCart.findIndex((item) => isSimpleVariant(menu, item));

    if (index > -1) {
      nextCart[index].qty += 1;
      nextCart[index].itemTotal += menu.base_price;
    } else {
      nextCart.push(newItem);
    }

    saveCart(nextCart);
  };

  const handleQuickRemove = (menu: Menu) => {
    const nextCart = [...cart];
    const index = nextCart.findIndex((item) => isSimpleVariant(menu, item));

    if (index === -1) return;

    if (nextCart[index].qty > 1) {
      nextCart[index].qty -= 1;
      nextCart[index].itemTotal -= menu.base_price;
    } else {
      nextCart.splice(index, 1);
    }

    saveCart(nextCart);
  };

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Rice Code</h1>
          <h2 className="mt-6 text-2xl font-semibold">Menu</h2>
        </div>

        <Link
          href="/cart"
          className="rounded-xl border border-black px-4 py-3"
        >
          ไปตะกร้า {totalQty > 0 ? `(${totalQty})` : ""}
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {menus.map((menu) => {
          const menuQty = getMenuQty(menu.id);
          const simpleQty = getSimpleMenuQty(menu);

          return (
            <div key={menu.id} className="rounded-2xl border p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="h-28 w-28 overflow-hidden rounded-lg bg-gray-100">
                  {menu.image_url ? (
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex flex-1 justify-between gap-4">
                  <div className="flex-1">
                    {menu.has_options ? (
                      <Link href={`/menu/${menu.id}`} className="block">
                        <h3 className="text-lg font-semibold">{menu.name}</h3>
                        <p className="text-sm text-gray-500">{menu.category}</p>

                        {menu.description && (
                          <p className="mt-1 text-sm text-gray-700">
                            {menu.description}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                          เลือกขนาดและเพิ่มรายการได้
                        </p>
                      </Link>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">{menu.name}</h3>
                        <p className="text-sm text-gray-500">{menu.category}</p>

                        {menu.description && (
                          <p className="mt-1 text-sm text-gray-700">
                            {menu.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">{menu.base_price} บาท</p>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {menu.has_options ? (
                        <>
                          <Link
                            href={`/menu/${menu.id}`}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            เลือกเมนู
                          </Link>

                          {menuQty > 0 && (
                            <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                              ในตะกร้า {menuQty} กล่อง
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                          <button
                            onClick={() => handleQuickRemove(menu)}
                            className="text-lg font-semibold"
                          >
                            -
                          </button>

                          <span className="min-w-[20px] text-center">
                            {simpleQty}
                          </span>

                          <button
                            onClick={() => handleQuickAdd(menu)}
                            className="text-lg font-semibold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}