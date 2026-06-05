import { NextRequest, NextResponse } from "next/server";

type TranslateLanguage = "en" | "id";

const isTranslateLanguage = (value: unknown): value is TranslateLanguage =>
  value === "en" || value === "id";

const extractTranslatedText = (payload: unknown) => {
  if (!Array.isArray(payload)) return "";
  const sentences = payload[0];
  if (!Array.isArray(sentences)) return "";

  return sentences
    .map((entry) => {
      if (!Array.isArray(entry)) return "";
      return typeof entry[0] === "string" ? entry[0] : "";
    })
    .join("");
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    text?: unknown;
    sourceLanguage?: unknown;
    targetLanguage?: unknown;
  } | null;

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const sourceLanguage = body?.sourceLanguage;
  const targetLanguage = body?.targetLanguage;

  if (!text) {
    return NextResponse.json({ success: true, data: { translatedText: "" } });
  }

  if (!isTranslateLanguage(sourceLanguage) || !isTranslateLanguage(targetLanguage)) {
    return NextResponse.json(
      { success: false, error: { message: "Unsupported translation language" } },
      { status: 400 },
    );
  }

  if (sourceLanguage === targetLanguage) {
    return NextResponse.json({ success: true, data: { translatedText: text } });
  }

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", sourceLanguage);
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { success: false, error: { message: "Translation service unavailable" } },
      { status: 502 },
    );
  }

  const translatedText = extractTranslatedText(await response.json());

  return NextResponse.json({
    success: true,
    data: {
      translatedText: translatedText || text,
    },
  });
}
