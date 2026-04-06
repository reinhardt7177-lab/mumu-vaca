export const BACKGROUND_PRESET = {
  bg_cloud: "from-sky-100 via-cyan-50 to-white",
  deco_lantern: "from-amber-100 via-orange-50 to-rose-50"
};

export function getBackgroundClass(itemKey) {
  return BACKGROUND_PRESET[itemKey] ?? "from-emerald-100 via-lime-50 to-white";
}

export function getCompanionLabel(itemKey) {
  if (itemKey === "pet_rabbit") return "토끼 친구";
  if (itemKey === "pet_owl") return "부엉이 수호자";
  return "요정 친구";
}

export function getTitleText(itemName) {
  if (!itemName) return "칭호 없음";
  return itemName.replace(/^칭호:\s*/, "");
}
