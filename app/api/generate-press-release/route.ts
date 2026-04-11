import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { stage, announcementType, companyName, newsHook, newsImpact, quoteName, quoteTitle, quoteText, boilerplate, eventSpecific, clarifyingAnswers } = body;

  let prompt = "";

  if (stage === "suggest_fields") {
    prompt = `The user is announcing a "${announcementType}" in the drinks/cannabis industry. 
    Suggest 3 to 5 technical category labels required for this specific news. 
    EXAMPLES: 
    - For Brand Launch: 'Launch Date', 'Launch City', 'Initial Markets'.
    - For New Hire: 'Full Name of Hire', 'New Title', 'Previous Company'.
    - For Product: 'ABV/Potency', 'SRP (Price)', 'Availability'.
    Return ONLY JSON: {"fields": [{"id": "f1", "label": "Label Name"}]}`;
  } 
  
  else if (stage === "audit") {
    prompt = `Audit this news hook for a "${announcementType}": "${newsHook}". 
    Rate 1-10 and give 1 sentence of blunt PR advice. 
    Return JSON: {"score": "8", "feedback": "..."}`;
  }

  else if (stage === "clarify") {
    prompt = `Based on this hook: "${newsHook}", ask 3 hard-hitting interview questions to make the story more "journalist-ready". 
    Return JSON: {"questions": ["...", "...", "..."]}`;
  }

  else if (stage === "final") {
    prompt = `You are a Senior PR Strategist for 'Business of Drinks'. 
    Write a professional Press Release and Media Pitch using ALL provided data.

    DATA POINTS:
    - Type: ${announcementType}
    - Company: ${companyName}
    - The Hook: ${newsHook}
    - Impact: ${newsImpact}
    - Narrative Specs: ${JSON.stringify(eventSpecific)}
    - Spokesperson: ${quoteName}, ${quoteTitle}
    - Quote: "${quoteText}"
    - Interview Context: ${clarifyingAnswers?.join(" | ")}
    - Boilerplate: ${boilerplate}

    REQUIREMENTS:
    1. DO NOT summarize. Use the specific details from Narrative Specs in the first two paragraphs.
    2. Incorporate the Quote exactly as provided.
    3. Use the Interview Context to add depth to the "Why Now" section.
    4. MANDATORY: End the release with a '### About ${companyName}' section containing the full Boilerplate.
    
    Return ONLY JSON: {"press_release": {"headline": "...", "body": "..."}, "media_pitch": "..."}`;
  }

  const response = await openai.chat.completions.create({
    model: "model: gpt-4o",
    messages: [{ role: "system", content: "You are a specialized PR AI for the beverage and cannabis industry. Output valid JSON only." }, { role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return NextResponse.json(JSON.parse(response.choices[0].message.content || "{}"));
}