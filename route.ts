import { NextResponse } from "next/server";
import { z } from "zod";
import JSON5 from "json5"; // ✅ Default import, not named

const clarifyResearchGoals = async (topic: string) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OpenRouter API Key");
  }

  const prompt = `
Given the research topic: "${topic}", generate 2-4 clarifying questions to help narrow down the research scope. Focus on identifying:
- Specific aspects of interest
- Required depth/complexity level
- Any particular perspective or excluded sources.

Respond only with a JSON object like:
{
  "questions": ["Question 1", "Question 2"]
}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  const result = await response.json();
  console.log("[🔍 Full OpenRouter response]:", JSON.stringify(result, null, 2));

  const rawText = result.choices?.[0]?.message?.content;
  if (!rawText) throw new Error("No content returned from model.");

  console.log("[🧠 LLM Raw Output]:", rawText);

  let parsed;
  try {
    parsed = JSON5.parse(rawText); // ✅ Use default import
  } catch (err) {
    console.error("[❌ JSON Parsing Failed]:", rawText);
    throw new Error("Could not parse LLM response into valid JSON.");
  }

  const schema = z.object({
    questions: z.array(z.string().min(1)),
  });

  const validated = schema.parse(parsed);
  return validated.questions;
};

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Invalid topic input" }, { status: 400 });
    }

    const questions = await clarifyResearchGoals(topic);
    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("🚨 API Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}
