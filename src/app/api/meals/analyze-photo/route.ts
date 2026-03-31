import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, COACH_MODEL } from "@/lib/anthropic/client";

export const runtime = "edge";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { image, mimeType = "image/jpeg" } = await request.json();

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: image,
            },
          },
          {
            type: "text",
            text: `Analyze this food photo and provide a nutritional breakdown.

The user follows a South Indian + general international diet. Common foods include: chappati, rice, dosa, sambar, paneer, dal, chicken curry, Thai curry, pasta, biryani, idli, upma, poha.

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "name": "descriptive meal name",
  "calories": estimated_total_calories_integer,
  "protein_g": estimated_protein_grams_float,
  "carbs_g": estimated_carbs_grams_float,
  "fat_g": estimated_fat_grams_float,
  "grams": estimated_total_grams_integer,
  "items": [
    {"name": "item name", "grams": grams, "calories": cal}
  ]
}

Be realistic about home-cooked South Indian portion sizes. If you cannot identify the food clearly, give your best estimate.`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
  }

  try {
    // Extract JSON from response (Claude sometimes adds surrounding text)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const meal = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ meal });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: content.text }, { status: 500 });
  }
}
