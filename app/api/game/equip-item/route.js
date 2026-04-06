import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { findShopItem } from "@/lib/game/shop-items";

const EQUIPPABLE_CATEGORIES = new Set(["background", "title", "companion"]);

export async function POST(request) {
  try {
    const body = await request.json();
    const studentId = body?.studentId;
    const itemKey = body?.itemKey;

    if (!studentId || !itemKey) {
      return NextResponse.json({ error: "studentId와 itemKey는 필수입니다." }, { status: 400 });
    }

    const item = findShopItem(itemKey);
    if (!item) {
      return NextResponse.json({ error: "존재하지 않는 아이템입니다." }, { status: 404 });
    }

    if (!EQUIPPABLE_CATEGORIES.has(item.category)) {
      return NextResponse.json({ error: "이 아이템은 장착할 수 없는 타입입니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { data: inventoryRow, error: inventoryError } = await supabase
      .from("student_inventory")
      .select("item_key, quantity")
      .eq("student_id", studentId)
      .eq("item_key", itemKey)
      .maybeSingle();

    if (inventoryError) {
      return NextResponse.json({ error: inventoryError.message }, { status: 500 });
    }

    if (!inventoryRow || (inventoryRow.quantity ?? 0) < 1) {
      return NextResponse.json({ error: "먼저 상점에서 아이템을 구매해 주세요." }, { status: 400 });
    }

    const { error: equipError } = await supabase.from("student_equips").upsert(
      {
        student_id: studentId,
        category: item.category,
        item_key: item.itemKey,
        item_name: item.itemName
      },
      { onConflict: "student_id,category" }
    );

    if (equipError) {
      return NextResponse.json({ error: equipError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `${item.itemName} 장착 완료!`,
      equipped: {
        category: item.category,
        itemKey: item.itemKey,
        itemName: item.itemName
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "아이템 장착 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
