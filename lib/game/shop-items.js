export const SHOP_ITEMS = [
  {
    itemKey: "bg_cloud",
    itemName: "구름빛 배경",
    description: "숲 하늘에 몽실몽실 구름 배경이 생겨요.",
    priceAcorns: 8,
    rarity: "common",
    category: "background"
  },
  {
    itemKey: "pet_rabbit",
    itemName: "토끼 친구",
    description: "숲에서 폴짝폴짝 뛰는 토끼 친구를 초대해요.",
    priceAcorns: 15,
    rarity: "rare",
    category: "companion"
  },
  {
    itemKey: "title_star_child",
    itemName: "칭호: 별빛 탐험가",
    description: "프로필에 반짝이는 칭호를 달 수 있어요.",
    priceAcorns: 12,
    rarity: "rare",
    category: "title"
  },
  {
    itemKey: "deco_lantern",
    itemName: "숲속 랜턴",
    description: "밤에도 따뜻한 빛이 나는 랜턴 장식이에요.",
    priceAcorns: 10,
    rarity: "common",
    category: "decoration"
  },
  {
    itemKey: "pet_owl",
    itemName: "부엉이 수호자",
    description: "미션을 응원해 주는 똑똑한 부엉이 친구예요.",
    priceAcorns: 20,
    rarity: "epic",
    category: "companion"
  }
];

export function findShopItem(itemKey) {
  return SHOP_ITEMS.find((item) => item.itemKey === itemKey) ?? null;
}
