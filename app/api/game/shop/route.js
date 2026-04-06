import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { SHOP_ITEMS } from "@/lib/game/shop-items";

export async function GET(request) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ items: SHOP_ITEMS, owned: [] });
    }

    const supabase = createSupabaseAdmin();
    const [{ data: inventory, error: inventoryError }, { data: equips, error: equipError }] = await Promise.all([
      supabase.from("student_inventory").select("item_key, quantity").eq("student_id", studentId),
      supabase.from("student_equips").select("category, item_key").eq("student_id", studentId)
    ]);

    if (inventoryError || equipError) {
      return NextResponse.json({ error: inventoryError?.message ?? equipError?.message }, { status: 500 });
    }

    const ownedMap = new Map((inventory ?? []).map((row) => [row.item_key, row.quantity]));
    const equippedMap = new Map((equips ?? []).map((row) => [row.category, row.item_key]));

    const items = SHOP_ITEMS.map((item) => ({
      ...item,
      ownedQuantity: ownedMap.get(item.itemKey) ?? 0,
      isEquipped: equippedMap.get(item.category) === item.itemKey
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "상점 정보를 불러오지 못했어요."
      },
      { status: 500 }
    );
  }
}
