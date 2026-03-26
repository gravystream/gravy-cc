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
    model: "claude-3-haiku-20240307",
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
    model: "claude-3-haiku-20240307",
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

// --- Portfolio AI Scoring ---

interface CheckPortfolioInput {
  portfolioVideos: {
    title: string;
    description?: string;
    niche?: string;
    platform?: string;
    cloudinaryUrl: string;
  }[];
  creatorNiches: string[];
  creatorBio?: string;
}

interface PortfolioAIResult {
  overallScore: number;       // 0-100
  contentQuality: number;     // 0-100
  nicheRelevance: number;     // 0-100
  profileCompleteness: number; // 0-100
  feedback: string;
  qualified: boolean;
}

export async function checkPortfolioQuality(input: CheckPortfolioInput, threshold: number = 50): Promise<PortfolioAIResult> {
  const client = new Anthropic();

  const videoDescriptions = input.portfolioVideos.map((v, i) =>
    `Video ${i + 1}: "${v.title}" - Niche: ${v.niche || "unspecified"}, Platform: ${v.platform || "unspecified"}${v.description ? `, Description: ${v.description}` : ""}, URL: ${v.cloudinaryUrl}`
  ).join("\n");

  const prompt = `You are an AI quality gate for a creator marketplace platform. Evaluate this creator's portfolio to determine if they meet the platform's quality standards.

CREATOR NICHES: ${input.creatorNiches.join(", ")}
CREATOR BIO: ${input.creatorBio || "Not provided"}

PORTFOLIO VIDEOS:
${videoDescriptions}

NUMBER OF VIDEOS: ${input.portfolioVideos.length}

Score the portfolio on these criteria (each 0-100):
1. CONTENT_QUALITY: Based on titles, descriptions, and variety. Do they show real content creation ability?
2. NICHE_RELEVANCE: Do the videos align with the creator's stated niches?
3. PROFILE_COMPLETENESS: Is there enough content to judge? (1 video = low, 3+ = good)

OVERALL_SCORE = (CONTENT_QUALITY * 0.45) + (NICHE_RELEVANCE * 0.30) + (PROFILE_COMPLETENESS * 0.25)
QUALIFIED = OVERALL_SCORE >= ${threshold}

Respond ONLY with valid JSON:
{
  "contentQuality": <number>,
  "nicheRelevance": <number>,
  "profileCompleteness": <number>,
  "overallScore": <number>,
  "qualified": <boolean>,
  "feedback": "<2-3 sentences of actionable feedback>"
}`;

  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned invalid JSON");

  const result = JSON.parse(jsonMatch[0]);
  return {
    overallScore: Math.round(result.overallScore),
    contentQuality: Math.round(result.contentQuality),
    nicheRelevance: Math.round(result.nicheRelevance),
    profileCompleteness: Math.round(result.profileCompleteness),
    feedback: result.feedback,
    qualified: result.overallScore >= threshold,
  };
}

export const checkProposalWithAI = checkProposalQuality;
