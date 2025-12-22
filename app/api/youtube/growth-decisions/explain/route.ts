import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface ExplanationRequest {
	metrics: {
		views?: number;
		watchTime?: number;
		ctr?: number;
		avgViewDuration?: number;
		retention?: number;
		subscribersGained?: number;
		impressions?: number;
	};
	triggeredRules: string[];
	context: string;
	videoTitle?: string;
}

export async function POST(request: NextRequest) {
	try {
		// Check if OpenAI API key is configured
		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json(
				{ error: "OpenAI API key not configured" },
				{ status: 500 }
			);
		}

		const body: ExplanationRequest = await request.json();
		const { metrics, triggeredRules, context, videoTitle } = body;

		// Build the prompt for AI explanation
		const prompt = `You are a YouTube growth advisor. Explain the following analytics data in plain, actionable language.

YouTube Analytics Overview:
${metrics.views ? `- Views: ${metrics.views.toLocaleString()}` : ""}
${metrics.watchTime ? `- Watch Time: ${metrics.watchTime.toLocaleString()} minutes` : ""}
${metrics.ctr ? `- CTR: ${metrics.ctr.toFixed(2)}%` : ""}
${metrics.avgViewDuration ? `- Average View Duration: ${Math.round(metrics.avgViewDuration)} seconds` : ""}
${metrics.retention ? `- Audience Retention: ${metrics.retention.toFixed(1)}%` : ""}
${metrics.impressions ? `- Impressions: ${metrics.impressions.toLocaleString()}` : ""}

Triggered Rules:
${triggeredRules.map(rule => `- ${rule}`).join("\n")}

Context: ${context}
${videoTitle ? `Video: "${videoTitle}"` : ""}

Provide a clear, non-technical explanation of:
1. What the data means
2. What the creator should do
3. Why it matters

Keep it concise (2-3 sentences max). Do NOT make up metrics or predictions. Only explain what the data shows.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: "You are a helpful YouTube growth advisor. Explain analytics data in plain language. Never make up metrics or predict virality. Only explain what the data shows.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 200,
			temperature: 0.7,
		});

		const explanation = completion.choices[0]?.message?.content || "Unable to generate explanation.";

		return NextResponse.json({
			success: true,
			explanation,
		});
	} catch (error) {
		console.error("[AI Explanation] Error:", error);
		// Return a fallback explanation if AI fails
		return NextResponse.json({
			success: false,
			explanation: "Based on your analytics data, the triggered rules indicate areas for improvement. Review the specific metrics and recommendations above.",
		});
	}
}

