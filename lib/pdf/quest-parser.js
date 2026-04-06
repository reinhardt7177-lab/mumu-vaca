function normalizeQuestType(line) {
  const lowered = line.toLowerCase();

  if (lowered.includes("선택") || lowered.includes("optional")) {
    return "optional";
  }

  if (lowered.includes("생존") || lowered.includes("출석") || lowered.includes("check")) {
    return "survival";
  }

  return "required";
}

function sanitizeLine(line) {
  return line.replace(/^[-*\d.)\s]+/, "").replace(/\s+/g, " ").trim();
}

export function parseQuestText(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map(sanitizeLine)
    .filter((line) => line.length >= 5)
    .filter((line) => /[가-힣a-zA-Z]/.test(line));

  const deduped = Array.from(new Set(lines));

  return deduped.slice(0, 80).map((line) => ({
    title: line.slice(0, 80),
    description: line.slice(0, 200),
    quest_type: normalizeQuestType(line)
  }));
}
