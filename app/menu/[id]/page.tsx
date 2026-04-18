import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MenuOptionsForm from "@/components/MenuOptionsForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type MenuOption = {
  id: string;
  menu_id: string;
  option_name: string;
  option_label: string;
  price_delta: number;
};

type Menu = {
  id: string;
  name: string;
  category: string;
  base_price: number;
  description: string | null;
  image_url: string | null;
};

type MenuAddonRow = {
  id: string;
  menu_id: string;
  addon_menu_id: string;
  sort_order: number | null;
  is_active: boolean | null;
};

type AddOnMenu = {
  id: string;
  name: string;
  base_price: number;
  image_url: string | null;
  description: string | null;
};

export default async function MenuDetail({ params }: Props) {
  const { id } = await params;

  const { data: menu, error } = await supabase
    .from("menus")
    .select("*")
    .eq("id", id)
    .single();

  const { data: options } = await supabase
    .from("menu_options")
    .select("*")
    .eq("menu_id", id);

  const { data: menuAddonRows } = await supabase
    .from("menu_addons")
    .select("*")
    .eq("menu_id", id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !menu) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Menu not found</h1>
        <pre className="mt-4 text-sm text-red-600">
          {JSON.stringify({ id, error }, null, 2)}
        </pre>
      </main>
    );
  }

  const typedMenu = menu as Menu;

  const riceSizes =
    (options as MenuOption[] | null)?.filter(
      (option) => option.option_name === "rice_size"
    ) ?? [];

  const addonRows = (menuAddonRows as MenuAddonRow[] | null) ?? [];
  const addonIds = addonRows.map((row) => row.addon_menu_id);

  let addonMenus: AddOnMenu[] = [];

  if (addonIds.length > 0) {
    const { data: addonMenuData } = await supabase
      .from("menus")
      .select("id, name, base_price, image_url, description")
      .in("id", addonIds)
      .eq("is_active", true);

    const addonMap = new Map(
      ((addonMenuData as AddOnMenu[] | null) ?? []).map((item) => [item.id, item])
    );

    addonMenus = addonRows
      .map((row) => addonMap.get(row.addon_menu_id))
      .filter(Boolean) as AddOnMenu[];
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-xl">
        <h1 className="text-center text-3xl font-bold">Rice Code {"</>"}</h1>

        <div className="mt-8 overflow-hidden rounded-lg bg-gray-100">
          {typedMenu.image_url ? (
            <img
              src={typedMenu.image_url}
              alt={typedMenu.name}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center text-gray-400">
              {typedMenu.name}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{typedMenu.name}</h2>
            {typedMenu.description && (
              <p className="mt-3 whitespace-pre-line text-lg leading-relaxed">
                {typedMenu.description}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right text-2xl font-bold">
            ราคา {typedMenu.base_price} บาท
          </div>
        </div>

        <MenuOptionsForm
          menuId={typedMenu.id}
          menuName={typedMenu.name}
          basePrice={typedMenu.base_price}
          riceSizes={riceSizes}
          addonMenus={addonMenus}
        />

        <Link
          href="/"
          className="mt-4 block w-full rounded-lg bg-gray-200 py-4 text-center text-xl"
        >
          กลับหน้าเมนูหลัก
        </Link>
      </div>
    </main>
  );
}