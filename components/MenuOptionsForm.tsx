"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type MenuOption = {
  id: string;
  menu_id: string;
  option_name: string;
  option_label: string;
  price_delta: number;
};

type AddOnMenu = {
  id: string;
  name: string;
  base_price: number;
  image_url: string | null;
  description: string | null;
};

type Props = {
  menuId: string;
  menuName: string;
  basePrice: number;
  riceSizes: MenuOption[];
  addonMenus: AddOnMenu[];
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
    qty: number;
  }[];
  itemTotal: number;
  itemNote?: string | null;
};

export default function MenuOptionsForm({
  menuId,
  menuName,
  basePrice,
  riceSizes,
  addonMenus,
}: Props) {
  const searchParams = useSearchParams();
  const editItemId = searchParams.get("edit");

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    riceSizes[0]?.id ?? null
  );
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [addonQtyMap, setAddonQtyMap] = useState<Record<string, number>>({});
  const [isLoadedFromEdit, setIsLoadedFromEdit] = useState(false);

  useEffect(() => {
    if (!editItemId || isLoadedFromEdit) return;

    const stored = localStorage.getItem("cart");
    if (!stored) {
      setIsLoadedFromEdit(true);
      return;
    }

    const cart: CartItem[] = JSON.parse(stored);
    const editingItem = cart.find((item) => item.id === editItemId);

    if (!editingItem) {
      setIsLoadedFromEdit(true);
      return;
    }

    if (editingItem.selectedSize) {
      const matchedSize = riceSizes.find(
        (size) => size.option_label === editingItem.selectedSize?.label
      );
      if (matchedSize) {
        setSelectedSizeId(matchedSize.id);
      }
    }

    setQty(editingItem.qty);
    setNote(editingItem.itemNote ?? "");

    const nextAddonQtyMap: Record<string, number> = {};
    for (const addon of editingItem.addOns ?? []) {
      nextAddonQtyMap[addon.id] = addon.qty;
    }
    setAddonQtyMap(nextAddonQtyMap);

    setIsLoadedFromEdit(true);
  }, [editItemId, isLoadedFromEdit, riceSizes]);

  const selectedSize =
    riceSizes.find((size) => size.id === selectedSizeId) ?? null;

  const increaseAddonQty = (addonId: string) => {
    setAddonQtyMap((prev) => ({
      ...prev,
      [addonId]: (prev[addonId] ?? 0) + 1,
    }));
  };

  const decreaseAddonQty = (addonId: string) => {
    setAddonQtyMap((prev) => ({
      ...prev,
      [addonId]: Math.max(0, (prev[addonId] ?? 0) - 1),
    }));
  };

  const selectedAddOns = useMemo(() => {
    return addonMenus
      .filter((addon) => (addonQtyMap[addon.id] ?? 0) > 0)
      .map((addon) => ({
        id: addon.id,
        label: addon.name,
        priceDelta: addon.base_price,
        qty: addonQtyMap[addon.id] ?? 0,
      }));
  }, [addonMenus, addonQtyMap]);

  const unitPrice =
    basePrice +
    (selectedSize?.price_delta ?? 0) +
    selectedAddOns.reduce((sum, item) => sum + item.priceDelta * item.qty, 0);

  const totalPrice = unitPrice * qty;

  const handleSave = () => {
    const stored = localStorage.getItem("cart");
    const cart: CartItem[] = stored ? JSON.parse(stored) : [];

    const normalizedNewAddOns = [...selectedAddOns]
      .map((a) => `${a.label}:${a.qty}`)
      .sort();

    const editingIndex = editItemId
      ? cart.findIndex((item) => item.id === editItemId)
      : -1;

    // ถ้ากำลังแก้ไข ให้เอา item เดิมออกก่อน เพื่อกันชนกับตัวเองตอน merge
    if (editingIndex > -1) {
      cart.splice(editingIndex, 1);
    }

    const sameItemIndex = cart.findIndex((item) => {
      const sameMenu = item.menuId === menuId;
      const sameSize = item.selectedSize?.label === selectedSize?.option_label;

      const oldAddOns = [...(item.addOns ?? [])]
        .map((a) => `${a.label}:${a.qty}`)
        .sort();

      return (
        sameMenu &&
        sameSize &&
        JSON.stringify(oldAddOns) === JSON.stringify(normalizedNewAddOns) &&
        (item.itemNote ?? "") === note
      );
    });

    const newItem: CartItem = {
      id: editItemId ?? crypto.randomUUID(),
      menuId,
      menuName,
      basePrice,
      qty,
      selectedSize: selectedSize
        ? {
            id: selectedSize.id,
            label: selectedSize.option_label,
            priceDelta: selectedSize.price_delta,
          }
        : null,
      addOns: selectedAddOns,
      itemTotal: totalPrice,
      itemNote: note || null,
    };

    if (sameItemIndex > -1) {
      cart[sameItemIndex].qty += qty;
      cart[sameItemIndex].itemTotal += totalPrice;
    } else {
      cart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    toast.success(
      editItemId
      ? "แก้ไขรายการแล้ว"
      : "เพิ่มรายการลงในตะกร้าแล้ว"
    );
    window.location.href = "/cart";
  };

  return (
    <div className="mt-8">
      {riceSizes.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold">เลือกขนาดข้าว</h3>
          <div className="mt-4 space-y-3">
            {riceSizes.map((size) => (
              <label
                key={size.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 p-4"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rice_size"
                    checked={selectedSizeId === size.id}
                    onChange={() => setSelectedSizeId(size.id)}
                  />
                  <span className="text-xl font-medium">
                    {size.option_label}
                  </span>
                </div>
                <span className="text-lg">+{size.price_delta} บาท</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {addonMenus.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold">Add-on</h3>

          <div className="mt-4 space-y-3">
            {addonMenus.map((addon) => {
              const addonQty = addonQtyMap[addon.id] ?? 0;

              return (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-lg border border-gray-300 p-4"
                >
                  <div className="flex-1">
                    <p className="text-xl font-medium">{addon.name}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-2xl font-bold">
                      <button onClick={() => decreaseAddonQty(addon.id)}>-</button>
                      <span className="min-w-[24px] text-center">{addonQty}</span>
                      <button onClick={() => increaseAddonQty(addon.id)}>+</button>
                    </div>

                    <p className="text-xl">ราคา {addon.base_price} บาท</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-lg bg-gray-100 p-4">
        <p className="text-sm text-gray-500">ราคารวม</p>
        <p className="text-3xl font-bold">{totalPrice} บาท</p>
      </div>

      <div className="mt-8">
        <label className="text-2xl font-semibold">หมายเหตุ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="mt-3 w-full rounded-lg bg-gray-200 p-4 text-lg outline-none"
          placeholder="เช่น ไม่ใส่ผัก, แยกน้ำจิ้ม"
        />
      </div>

      <div className="mt-8 flex items-center justify-center gap-10 text-4xl font-bold">
        <button
          onClick={() => setQty((prev) => Math.max(1, prev - 1))}
          className="px-4"
        >
          -
        </button>
        <span>{qty}</span>
        <button
          onClick={() => setQty((prev) => prev + 1)}
          className="px-4"
        >
          +
        </button>
      </div>

      <button
        onClick={handleSave}
        className="mt-8 block w-full rounded-lg bg-black py-4 text-center text-xl text-white"
      >
        {editItemId ? "บันทึกการแก้ไข" : "เพิ่มรายการลงในตะกร้า"}
      </button>
    </div>
  );
}