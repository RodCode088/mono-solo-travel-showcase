const EMOJI_PATTERN =
  /(?:[\u{1F1E6}-\u{1F1FF}]{2}|[\u{1F3FB}-\u{1F3FF}]|(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\uFE0E)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\uFE0E)?)*)/gu;

export function stripEmojis(value) {
  return String(value ?? "")
    .replace(EMOJI_PATTERN, "")
    .replace(/[\u200D\uFE0E\uFE0F]\u20E3?/g, "")
    .replace(/\u20E3/g, "");
}

export function cleanDisplayText(value) {
  return stripEmojis(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function cleanDisplayList(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => cleanDisplayText(item)).filter(Boolean);
}
