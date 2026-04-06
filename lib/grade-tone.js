export const gradeTone = {
  1: "안녕, 반가워. 오늘도 한 걸음씩 함께 가보자.",
  2: "오늘도 요정님이 응원해. 작은 미션부터 차근차근 해보자.",
  3: "좋아, 오늘의 계획을 하나씩 체크하면 금방 끝낼 수 있어.",
  4: "네가 해낸 만큼 숲이 더 예뻐질 거야. 시작해 볼까?",
  5: "스스로 계획하는 힘이 자라고 있어. 오늘도 멋지게 도전해 보자.",
  6: "최고학년답게, 네 페이스로 꾸준히 완주해 보자."
};

export function getToneByGrade(grade) {
  const numericGrade = Number(grade);
  return gradeTone[numericGrade] ?? gradeTone[3];
}
