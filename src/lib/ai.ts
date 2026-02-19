import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AIQualityResult {
  overallScore: number;       // 0-100
  videoScore: number;         // 0-100
  audioScore: number;         // 0-100
  relevanceScore: number;     // 0-100
  feedback: string;
  qualified: boolean;         // overall >= 60
}

interface CheckProposalInput {
  pitchVideoUrl?: string;
  coverLetter?: string;
  campaignBrief: string;
  creatorNiches: string[];
}

interface CheckDeliverableInput {
  videoUrl: string;
  campaignBrief: string;
  deliverables: string[];
}

/**
 * AI Quality Gate — check a creator proposal
 * Uses Claude to evaluate pitch video quality (via URL description) and text relevance
 */
export async function checkProposalQuality(input: CheckProposalInput): Promise<AIQualityResult> {
  const prompt = `You are an AI quality gate for a creator marketplace platform. Evaluate this creator proposal for a brand campaign.

CAMPAIGN BRIEF:
${input.campaignBrief}

CREATOR NICHES: ${input.creatorNiches.join(", ")}

${input.pitchVideoUrl ? `PITCH VIDEO URL: ${input.pitchVideoUrl}` : "No pitch video submitted."}

COVER LETTER:
${input.coverLetter || "Not provided."}

Score the proposal on the following criteria (0-100 each):
1. VIDEO_SCORE: Technical quality of the pitch video (lighting, audio, editing, production value). If no video, score 50.
2. AUDIO_SCORE: Audio clarity and quality in the video. If no video, score 50.
3. RELEVANCE_SCORE: How well the creator's content style and cover letter aligns with the campaign brief.

Then compute an OVERALL_SCORE as: (VIDEO_SCORE * 0.35) + (AUDIO_SCORE * 0.25) + (RELEVANCE_SCORE * 0.40)

A proposal QUALIFIES if OVERALL_SCORE >= 60.

Respond ONLY with valid JSON in this exact format:
{
  "videoScore": <number>,
  "audioScore": <number>,
  "relevanceScore": <number>,
  "overallScore": <number>,
  "qualified": <boolean>,
  "feedback": "<2-3 sentences of constructive feedback for the creator>"
}`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned invalid JSON");

  const result = JSON.parse(jsonMatch[0]);
  return {
    overallScore: Math.round(result.overallScore),
    videoScore: Math.round(result.videoScore),
    audioScore: Math.round(result.audioScore),
    relevanceScore: Math.round(result.relevanceScore),
    feedback: result.feedback,
    qualified: result.overallScore >= 60,
  };
}

/**
 * AI Quality Gate — check a final job deliverable
 */
export async function checkDeliverableQuality(input: CheckDeliverableInput): Promise<AIQualityResult> {
  const prompt = `You are an AI quality gate for a creator marketplace platform. Evaluate this final video deliverable.

CAMPAIGN BRIEF:
${input.campaignBrief}

REQUIRED DELIVERABLES: ${input.deliverables.join(", ")}

DELIVERED VIDEO URL: ${input.videoUrl}

Score on the following criteria (0-100 each):
1. VIDEO_SCORE: Technical video quality (resolution, lighting, color, editing, motion).
2. AUDIO_SCORE: Audio quality (clarity, volume, noise level, music balance).
3. RELEVANCE_SCORE: How well the video fulfills the brief and deliverable requirements.

OVERALL_SCORE = (VIDEO_SCORE * 0.35) + (AUDIO_SCORE * 0.25) + (RELEVANCE_SCORE * 0.40)
QUALIFIED = OVERALL_SCORE >= 60

Respond ONLY with valid JSON:
{
  "videoScore": <number>,
  "audioScore": <number>,
  "relevanceScore": <number>,
  "overallScore": <number>,
  "qualified": <boolean>,
  "feedback": "<2-3 sentences of actionable feedback>"
}`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned invalid JSON");

  const result = JSON.parse(jsonMatch[0]);
  return {
    overallScore: Math.round(result.overallScore),
    videoScore: Math.round(result.videoScore),
    audioScore: Math.round(result.audioScore),
    relevanceScore: Math.round(result.relevanceScore),
    feedback: result.feedback,
    qualified: result.overallScore >= 60,
  };
}
export const checkProposalWithAI = checkProposalQuality;
