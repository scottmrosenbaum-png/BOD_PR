// app/lib/prompts.ts

export const systemPrompt = `
You are a senior B2B editorial strategist for the "Business of Drinks" platform. 
Generate a professional media package in JSON format.

REQUIRED FIELDS IN JSON:
1. "headline_options": Array of 3 strings.
2. "press_release": Object with "headline", "subheadline", "dateline", "body", "contact".
3. "linkedin_post": A professional social post string.
4. "media_pitch": A 3-paragraph email pitch string.

Style: Professional, data-driven, and journalistic. No hype words like "revolutionary."
`;

export function buildUserPrompt(data: any) {
  const eventDetails = Object.entries(data.eventSpecific || {})
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join("\n");

  return `
    COMPANY: ${data.companyName}
    ANNOUNCEMENT TYPE: ${data.announcementType}
    STORY ARCHITECTURE:
    - THE HOOK: ${data.newsHook}
    - THE IMPACT: ${data.newsImpact}
    - THE TARGET: ${data.newsTarget}
    
    TECHNICAL DETAILS:
    ${eventDetails}

    INTERVIEW INSIGHTS:
    ${data.clarifyingAnswers?.join(" | ")}

    SPOKESPERSON: ${data.quoteName}, ${data.quoteTitle}
    QUOTE: "${data.quoteText}"
    
    Return the package as a strictly valid JSON object.
  `;
}