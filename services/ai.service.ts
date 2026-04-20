import Anthropic from '@anthropic-ai/sdk';
import type { AuditData, AiAnalysisResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Close any open arrays/objects in truncated JSON
function repairTruncatedJson(raw: string): string {
  // Remove trailing incomplete object (last incomplete {...)
  const lastComplete = raw.lastIndexOf('},');
  if (lastComplete !== -1) {
    raw = raw.slice(0, lastComplete + 1);
  }
  // Count unclosed brackets and close them
  const opens = (raw.match(/\[/g) ?? []).length - (raw.match(/\]/g) ?? []).length;
  const braces = (raw.match(/\{/g) ?? []).length - (raw.match(/\}/g) ?? []).length;
  raw = raw.trimEnd().replace(/,\s*$/, '');
  raw += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, braces));
  return raw;
}

function buildAuditPrompt(data: AuditData): string {
  return `You are an expert web auditor. Analyze the following site audit data and return a structured JSON response.

URL: ${data.url}

SEO DATA:
${JSON.stringify(data.seo)}

PERFORMANCE DATA:
${JSON.stringify(data.performance)}

SECURITY DATA:
${JSON.stringify(data.security)}

Respond with ONLY a valid JSON object (no markdown, no extra text, no trailing commas):
{
  "overallScore": <integer 0-100>,
  "summary": "<1-2 sentence summary>",
  "recommendations": [
    {
      "category": "<SEO|PERFORMANCE|SECURITY>",
      "severity": "<CRITICAL|WARNING|PASSED>",
      "title": "<concise title under 60 chars>",
      "description": "<under 120 chars>",
      "recommendation": "<under 120 chars>"
    }
  ]
}

Rules:
- overallScore: 0=broken, 100=perfect
- Return EXACTLY 3 recommendations per category (9 total)
- CRITICAL: missing HTTPS, no title/meta, major security headers absent
- WARNING: suboptimal but not broken
- PASSED: checks that pass
- Keep all string values short to avoid truncation
- Do not invent data not present in the audit`;
}

export async function analyzeWithAi(data: AuditData): Promise<AiAnalysisResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildAuditPrompt(data) }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected AI response type');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  let raw = jsonMatch[0];

  // If JSON is truncated (incomplete array/object), attempt to close it
  if (message.stop_reason === 'max_tokens') {
    raw = repairTruncatedJson(raw);
  }

  return JSON.parse(raw) as AiAnalysisResult;
}
