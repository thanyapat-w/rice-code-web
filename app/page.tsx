import { supabase } from "@/lib/supabase";
import MenuListClient from "@/components/MenuListClient";

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

export default async function Home() {
  const { data: menus, error } = await supabase
    .from("menus")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">Rice Code {"</>"}</h1>
        <p className="mt-4 text-red-600">Failed to load menus.</p>
        <pre className="mt-2 text-sm">{error.message}</pre>
      </main>
    );
  }

  return <MenuListClient menus={(menus as Menu[]) ?? []} />;
}