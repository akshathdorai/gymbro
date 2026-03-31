import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// Proxy for USDA FoodData Central API
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) return NextResponse.json({ foods: [] });

  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=10&api_key=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json({ foods: [], error: "USDA API error" });
    }

    const data = await res.json();
    const foods = (data.foods || []).map((food: {
      description: string;
      foodNutrients: Array<{ nutrientName: string; value: number }>;
    }) => {
      const getNutrient = (name: string) =>
        food.foodNutrients?.find((n) => n.nutrientName?.toLowerCase().includes(name.toLowerCase()))?.value || 0;

      return {
        name: food.description,
        calories: Math.round(getNutrient("Energy")),
        protein_g: Math.round(getNutrient("Protein") * 10) / 10,
        carbs_g: Math.round(getNutrient("Carbohydrate") * 10) / 10,
        fat_g: Math.round(getNutrient("Total lipid") * 10) / 10,
        grams: 100, // USDA values are per 100g
      };
    });

    return NextResponse.json({ foods });
  } catch {
    return NextResponse.json({ foods: [], error: "Search failed" });
  }
}
