import { describe, it, expect } from "vitest";

describe("OpenRouter API Integration (DeepSeek)", () => {
  it("should validate OpenRouter API key is configured", async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.length).toBeGreaterThan(0);
  });

  it("should make a successful test request to OpenRouter API with DeepSeek model", async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured");
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "user",
              content: "Say 'API is working' in exactly 3 words.",
            },
          ],
          max_tokens: 10,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("OpenRouter API error:", data);
        throw new Error(`API returned status ${response.status}: ${JSON.stringify(data)}`);
      }

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty("choices");
      expect(data.choices).toBeInstanceOf(Array);
      expect(data.choices.length).toBeGreaterThan(0);
    } catch (error) {
      console.error("OpenRouter API test failed:", error);
      throw error;
    }
  });
});
