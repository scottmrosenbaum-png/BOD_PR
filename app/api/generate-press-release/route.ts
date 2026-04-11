import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { stage, announcementType, companyName, newsHook, quoteName, quoteTitle, quoteText, boilerplate, eventSpecific, clarifyingAnswers } = body;

  if (stage === "audit") {
    const prompt = `Act as a PR strategist. Audit this news: ${newsHook}. 
    Rate 1-10 on 'Newsworthiness' and give 1 sentence of blunt feedback. 
    Return JSON: { "score": number, "feedback": "string" }`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return NextResponse.json(JSON.parse(completion.choices[0].message.content!));
  }

  if (stage === "clarify") {
    const prompt = `Based on this: ${newsHook}, what 3 specific questions would a journalist ask to make this a better story? 
    Return JSON: { "questions": ["string", "string", "string"] }`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return NextResponse.json(JSON.parse(completion.choices[0].message.content!));
  }

  if (stage === "final") {
    const prompt = `Write a high-end PR package for ${companyName} regarding ${announcementType}.
    News: ${newsHook}. Quote from ${quoteName} (${quoteTitle}): "${quoteText}".
    Context: ${JSON.stringify(eventSpecific)}. Clarifications: ${clarifyingAnswers.join(" ")}.
    
    CRITICAL INSTRUCTIONS:
    1. The Press Release MUST include the following boilerplate at the VERY END of the body: "${boilerplate}". DO NOT put it anywhere else.
    2. Write a professional Media Pitch.
    3. Write a LinkedIn post.
    
    Return ONLY JSON in this format:
    {
      "press_release": { "headline": "string", "body": "string" },
      "media_pitch": "string",
      "linkedin_post": "string"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return NextResponse.json(JSON.parse(completion.choices[0].message.content!));
  }
}