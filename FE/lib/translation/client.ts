export type TranslateLanguage = "en" | "id";

export async function translateText(
  text: string,
  sourceLanguage: TranslateLanguage,
  targetLanguage: TranslateLanguage,
) {
  const normalizedText = text.trim();
  if (!normalizedText || sourceLanguage === targetLanguage) return normalizedText;

  const response = await fetch("/api/v1/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: normalizedText,
      sourceLanguage,
      targetLanguage,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || "Failed to translate text");
  }

  return String(result.data?.translatedText || normalizedText).trim();
}
