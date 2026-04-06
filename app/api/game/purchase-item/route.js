import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { findShopItem } from "@/lib/game/shop-items";

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
      return NextResponse.json({ error: "존재하지 않는 상점 아이템입니다." }, { status: 404 });
    }

    const supabase = createSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, acorns")
      .eq("id", studentId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "학생 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if ((profile.acorns ?? 0) < item.priceAcorns) {
      return NextResponse.json(
        { error: `도토리가 부족해요. 필요: ${item.priceAcorns}, 보유: ${profile.acorns ?? 0}` },
        { status: 400 }
      );
    }

    const nextAcorns = (profile.acorns ?? 0) - item.priceAcorns;

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ acorns: nextAcorns })
      .eq("id", studentId);

    if (updateProfileError) {
      return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
    }

    const { data: currentItem, error: currentItemError } = await supabase
      .from("student_inventory")
      .select("id, quantity")
      .eq("student_id", studentId)
      .eq("item_key", item.itemKey)
      .maybeSingle();

    if (currentItemError) {
      return NextResponse.json({ error: currentItemError.message }, { status: 500 });
    }

    if (currentItem) {
      const { error: updateInventoryError } = await supabase
        .from("student_inventory")
        .update({ quantity: currentItem.quantity + 1 })
        .eq("id", currentItem.id);

      if (updateInventoryError) {
        return NextResponse.json({ error: updateInventoryError.message }, { status: 500 });
      }
    } else {
      const { error: insertInventoryError } = await supabase.from("student_inventory").insert({
        student_id: studentId,
        item_key: item.itemKey,
        item_name: item.itemName,
        quantity: 1
      });

      if (insertInventoryError) {
        return NextResponse.json({ error: insertInventoryError.message }, { status: 500 });
      }
    }

    const { error: purchaseLogError } = await supabase.from("shop_purchase_logs").insert({
      student_id: studentId,
      item_key: item.itemKey,
      item_name: item.itemName,
      price_acorns: item.priceAcorns
    });

    if (purchaseLogError) {
      return NextResponse.json({ error: purchaseLogError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `${item.itemName} 구매 완료! 숲이 더 멋져졌어요.`,
      item,
      remainingAcorns: nextAcorns
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "아이템 구매 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
