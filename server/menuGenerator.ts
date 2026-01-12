import { ENV } from "./_core/env";
import type { DayMenu, Meal, NutritionSummary, UserPreferences } from "../drizzle/schema";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface MenuGenerationRequest {
  preferences: UserPreferences;
  numberOfDays?: number;
  startDate?: Date;
}

export interface GeneratedMenu {
  menuData: Record<string, DayMenu>;
  nutritionSummary: NutritionSummary;
}


export async function generateWeeklyMenu(
  request: MenuGenerationRequest
): Promise<GeneratedMenu> {
  const { preferences, numberOfDays = 7 } = request;

  const prompt = buildMenuGenerationPrompt(preferences, numberOfDays);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a professional nutritionist and chef. Generate detailed, balanced, and delicious weekly meal plans based on user preferences. Always respond with valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from API");
    }

    // Parse the JSON response
    const menuData = JSON.parse(content);
    const nutritionSummary = calculateNutritionSummary(menuData);

    return {
      menuData,
      nutritionSummary,
    };
  } catch (error) {
    console.error("Error generating menu:", error);
    throw error;
  }
}

/**
 * Build the prompt for menu generation
 */
function buildMenuGenerationPrompt(
  preferences: UserPreferences,
  numberOfDays: number
): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].slice(
    0,
    numberOfDays
  );

  const dietaryInfo = preferences.dietaryRestrictions.length
    ? `Dietary restrictions: ${preferences.dietaryRestrictions.join(", ")}`
    : "No dietary restrictions";

  const allergiesInfo = preferences.allergies.length
    ? `Allergies to avoid: ${preferences.allergies.join(", ")}`
    : "No known allergies";

  const goalsInfo = preferences.nutritionalGoals.length
    ? `Nutritional goals: ${preferences.nutritionalGoals.join(", ")}`
    : "General health maintenance";

  const dislikedInfo = preferences.dislikedIngredients.length
    ? `Disliked ingredients: ${preferences.dislikedIngredients.join(", ")}`
    : "No specific dislikes";

  const mealsPerDay = preferences.mealsPerDay || 3;
  const includeSnacks = preferences.includeSnacks ? "Yes" : "No";

  return `
Generate a ${numberOfDays}-day personalized meal plan with the following specifications:

User Preferences:
- ${dietaryInfo}
- ${allergiesInfo}
- ${goalsInfo}
- ${dislikedInfo}
- Preferred cuisines: ${preferences.preferredCuisines.join(", ") || "Any"}
- Daily calorie target: ${preferences.targetCalories} calories
- Protein target: ${preferences.targetProtein}g
- Carbs target: ${preferences.targetCarbs}g
- Fat target: ${preferences.targetFat}g
- Meals per day: ${mealsPerDay}
- Include snacks: ${includeSnacks}

Days to plan: ${days.join(", ")}

For each day, create meals with:
- Breakfast
- Lunch
- Dinner
${includeSnacks === "Yes" ? "- Snacks (1-2 items)" : ""}

For each meal, provide a JSON object with:
{
  "name": "meal name",
  "description": "brief description",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "prepTime": number (minutes),
  "difficulty": "easy|medium|hard",
  "recipe": "brief cooking instructions"
}

Respond ONLY with a valid JSON object in this format (no markdown, no extra text):
{
  "monday": {
    "breakfast": {...},
    "lunch": {...},
    "dinner": {...}
    ${includeSnacks === "Yes" ? ',"snacks": [{...}]' : ""}
  },
  "tuesday": {...},
  ...
}

Ensure:
1. All meals comply with dietary restrictions and allergies
2. Daily nutrition is close to targets
3. Meals are balanced and nutritious
4. Variety across the week
5. Realistic prep times
6. Ingredients are commonly available
`;
}

/**
 * Calculate nutrition summary from menu data
 */
function calculateNutritionSummary(menuData: Record<string, DayMenu>): NutritionSummary {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let dayCount = 0;

  for (const day of Object.values(menuData)) {
    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;

    // Add breakfast
    if (day.breakfast) {
      dayCalories += day.breakfast.calories;
      dayProtein += day.breakfast.protein;
      dayCarbs += day.breakfast.carbs;
      dayFat += day.breakfast.fat;
    }

    // Add lunch
    if (day.lunch) {
      dayCalories += day.lunch.calories;
      dayProtein += day.lunch.protein;
      dayCarbs += day.lunch.carbs;
      dayFat += day.lunch.fat;
    }

    // Add dinner
    if (day.dinner) {
      dayCalories += day.dinner.calories;
      dayProtein += day.dinner.protein;
      dayCarbs += day.dinner.carbs;
      dayFat += day.dinner.fat;
    }

    // Add snacks
    if (day.snacks && Array.isArray(day.snacks)) {
      for (const snack of day.snacks) {
        dayCalories += snack.calories;
        dayProtein += snack.protein;
        dayCarbs += snack.carbs;
        dayFat += snack.fat;
      }
    }

    totalCalories += dayCalories;
    totalProtein += dayProtein;
    totalCarbs += dayCarbs;
    totalFat += dayFat;
    dayCount++;
  }

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    averageCaloriesPerDay: dayCount > 0 ? totalCalories / dayCount : 0,
    averageProteinPerDay: dayCount > 0 ? totalProtein / dayCount : 0,
    averageCarbsPerDay: dayCount > 0 ? totalCarbs / dayCount : 0,
    averageFatPerDay: dayCount > 0 ? totalFat / dayCount : 0,
  };
}

/**
 * Generate shopping list from menu
 */
export function generateShoppingList(menuData: Record<string, DayMenu>) {
  const ingredientMap = new Map<
    string,
    {
      quantity: number;
      unit: string;
      category: string;
    }
  >();

  // Collect all ingredients
  for (const day of Object.values(menuData)) {
    collectIngredients(day.breakfast, ingredientMap);
    collectIngredients(day.lunch, ingredientMap);
    collectIngredients(day.dinner, ingredientMap);

    if (day.snacks && Array.isArray(day.snacks)) {
      for (const snack of day.snacks) {
        collectIngredients(snack, ingredientMap);
      }
    }
  }

  // Convert to shopping list items
  const items = Array.from(ingredientMap.entries()).map(([name, data]) => ({
    name,
    quantity: data.quantity,
    unit: data.unit,
    category: data.category,
    checked: false,
  }));

  // Sort by category
  items.sort((a, b) => a.category.localeCompare(b.category));

  return items;
}

/**
 * Helper to collect ingredients from a meal
 */
function collectIngredients(
  meal: Meal | undefined,
  ingredientMap: Map<
    string,
    {
      quantity: number;
      unit: string;
      category: string;
    }
  >
) {
  if (!meal || !meal.ingredients) return;

  for (const ingredient of meal.ingredients) {
    // Simple parsing - in production, you'd want more sophisticated parsing
    const existing = ingredientMap.get(ingredient) || {
      quantity: 1,
      unit: "piece",
      category: "other",
    };

    existing.quantity += 1;
    ingredientMap.set(ingredient, existing);
  }
}
