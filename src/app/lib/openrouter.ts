import { TextBlock, SpeakerGender } from "../types";

// ──────────────────────────────────────────────
// Mock Thai translations pool
// ──────────────────────────────────────────────
const MOCK_TRANSLATIONS: Array<{ original: string; translated: string; speakerGender: SpeakerGender }> = [
  { original: "お前には絶対に負けない！", translated: "ฉันจะไม่แพ้แกอย่างเด็ดขาด!", speakerGender: "male" },
  { original: "なぜ...こんなことを？", translated: "ทำไม... ถึงทำแบบนี้คะ?", speakerGender: "female" },
  { original: "みんなを守るためだ！", translated: "เพื่อปกป้องทุกคนครับ!", speakerGender: "male" },
  { original: "逃げるんだ！今すぐ！", translated: "หนีไปเถอะ! ตอนนี้เลยค่ะ!", speakerGender: "female" },
  { original: "俺は絶対に諦めない！", translated: "ผมจะไม่ยอมแพ้อย่างเด็ดขาดครับ!", speakerGender: "male" },
  { original: "信じてくれ！", translated: "เชื่อผมเถอะครับ!", speakerGender: "male" },
  { original: "一緒に戦おう！", translated: "มาสู้ด้วยกันเถอะค่ะ!", speakerGender: "female" },
  { original: "この力...何だ!?", translated: "พลังนี้... มันคืออะไร!?", speakerGender: "male" },
  { original: "まだ終わってないぞ！", translated: "มันยังไม่จบแค่นี้นะครับ!", speakerGender: "male" },
  { original: "お願い、助けて！", translated: "ได้โปรด ช่วยหนูด้วยค่ะ!", speakerGender: "female" },
  { original: "これが俺の最後の力だ！", translated: "นี่คือพลังสุดท้ายของผมครับ!", speakerGender: "male" },
  { original: "あなたが大切だから", translated: "เพราะหนูห่วงใยคุณค่ะ", speakerGender: "female" },
];

// Default positions when no existing blocks are present
const DEFAULT_BUBBLE_POSITIONS = [
  { x: 6,  y: 4,  width: 34, height: 12 },
  { x: 57, y: 4,  width: 33, height: 12 },
  { x: 5,  y: 46, width: 36, height: 13 },
  { x: 56, y: 46, width: 35, height: 13 },
  { x: 10, y: 78, width: 30, height: 11 },
  { x: 58, y: 78, width: 30, height: 11 },
];

function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ──────────────────────────────────────────────
// Mock translation — preserves existing block positions
// ──────────────────────────────────────────────
async function mockTranslatePage(count = 4, existingBlocks: TextBlock[] = []): Promise<TextBlock[]> {
  await new Promise((r) => setTimeout(r, 2200 + Math.random() * 800));

  // If existing blocks are present, match their count and reuse positions
  const targetCount = existingBlocks.length > 0 ? existingBlocks.length : count;
  const shuffled = [...MOCK_TRANSLATIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(targetCount, MOCK_TRANSLATIONS.length));

  return selected.map((item, i) => {
    const existing = existingBlocks[i];
    const defaultPos = DEFAULT_BUBBLE_POSITIONS[i % DEFAULT_BUBBLE_POSITIONS.length];

    return {
      // Keep the existing block's ID so canvas selection stays stable
      id: existing?.id ?? generateId(),
      original: item.original,
      translated: item.translated,
      speakerGender: item.speakerGender,
      // Preserve the user's existing position/size or fall back to defaults
      x:      existing?.x      ?? defaultPos.x,
      y:      existing?.y      ?? defaultPos.y,
      width:  existing?.width  ?? defaultPos.width,
      height: existing?.height ?? defaultPos.height,
      // Preserve visual style choices
      fontSize: existing?.fontSize ?? 13,
      color:    existing?.color    ?? "#000000",
      bgColor:  existing?.bgColor  ?? "#ffffff",
    };
  });
}

// ──────────────────────────────────────────────
// Real OpenRouter translation
// ──────────────────────────────────────────────
const VISION_PROMPT = `You are a professional Thai manga translator.
Analyze this image:
1. Detect every speech bubble and its exact position (x,y,width,height) as percentages of image dimensions
2. Identify the speaker's gender and clothing style to decide honorifics (ครับ/ค่ะ/คะ/นะ/จ้ะ etc.)
3. Return ONLY valid JSON:
{
  "blocks": [
    {
      "original": "raw Japanese text",
      "translated": "perfect natural Thai with correct honorifics",
      "x": 10,
      "y": 5,
      "width": 30,
      "height": 12,
      "speakerGender": "female"
    }
  ]
}
Return ONLY the JSON, no other text.`;

async function realTranslatePage(imageUrl: string, apiKey: string, existingBlocks: TextBlock[] = []): Promise<TextBlock[]> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Comic Trans Studio",
    },
    body: JSON.stringify({
      model: "qwen/qwen2-vl-72b-instruct:free",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response as JSON");

  const parsed = JSON.parse(jsonMatch[0]);
  const blocks: TextBlock[] = (parsed.blocks ?? []).map((b: {
    original?: string;
    translated?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    speakerGender?: string;
  }, i: number) => {
    // For real API: if existing blocks present, overlay the AI-detected x/y onto them
    const existing = existingBlocks[i];
    return {
      id: existing?.id ?? generateId(),
      original: b.original ?? "",
      translated: b.translated ?? "",
      // Prefer AI-detected positions for real translation, but keep style prefs
      x:      typeof b.x === "number" ? b.x : (existing?.x ?? 10),
      y:      typeof b.y === "number" ? b.y : (existing?.y ?? 10),
      width:  typeof b.width  === "number" ? b.width  : (existing?.width  ?? 30),
      height: typeof b.height === "number" ? b.height : (existing?.height ?? 12),
      speakerGender: (b.speakerGender as SpeakerGender) ?? "unknown",
      fontSize: existing?.fontSize ?? 13,
      color:    existing?.color    ?? "#000000",
      bgColor:  existing?.bgColor  ?? "#ffffff",
    };
  });

  return blocks;
}

// ──────────────────────────────────────────────
// Public API — existingBlocks is forwarded to preserve positions
// ──────────────────────────────────────────────
export async function translatePage(
  imageUrl: string,
  apiKey?: string,
  bubbleCount = 4,
  existingBlocks: TextBlock[] = []
): Promise<TextBlock[]> {
  if (apiKey && apiKey.trim().length > 10) {
    return realTranslatePage(imageUrl, apiKey.trim(), existingBlocks);
  }
  return mockTranslatePage(bubbleCount, existingBlocks);
}
