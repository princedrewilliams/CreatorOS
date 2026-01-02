import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Lazy initialization - only create client when needed
function getOpenAIClient() {
	if (!process.env.OPENAI_API_KEY) {
		return null;
	}
	const { OpenAI } = require("openai");
	return new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
}

interface InsightsRequest {
	sponsorId: string;
	performance: {
		totalViews: number;
		totalWatchTime: number;
		averageCTR: number;
		totalEngagement: number;
		costPerView: number;
		costPerMinute: number;
		videos: Array<{
			videoId: string;
			title: string;
			views: number;
			watchTime: number;
			ctr: number;
			engagement: number;
		}>;
	};
	dealValue: number;
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body: InsightsRequest = await request.json();
		const { performance, dealValue } = body;

		// Check if OpenAI API key is configured
		const openai = getOpenAIClient();
		if (!openai) {
			// Return a fallback summary if OpenAI is not configured
			return NextResponse.json({
				success: false,
				summary: `This sponsorship generated ${performance.totalViews.toLocaleString()} total views and ${Math.round(performance.totalWatchTime).toLocaleString()} minutes of watch time. The average CTR was ${performance.averageCTR.toFixed(1)}% with ${performance.totalEngagement.toFixed(1)}% engagement rate. Cost per view: $${performance.costPerView.toFixed(3)}. Cost per minute watched: $${performance.costPerMinute.toFixed(2)}.`,
			});
		}

		// Build the prompt for AI summary
		const prompt = `You are a YouTube sponsorship performance analyst. Generate a professional, concise summary of the following sponsorship performance data.

Sponsorship Performance Data:
- Deal Value: $${dealValue.toLocaleString()}
- Total Views: ${performance.totalViews.toLocaleString()}
- Total Watch Time: ${Math.round(performance.totalWatchTime).toLocaleString()} minutes
- Average CTR: ${performance.averageCTR.toFixed(1)}%
- Average Engagement Rate: ${performance.totalEngagement.toFixed(1)}%
- Cost per View: $${performance.costPerView.toFixed(3)}
- Cost per Minute Watched: $${performance.costPerMinute.toFixed(2)}
- Number of Videos: ${performance.videos.length}

Video Performance:
${performance.videos.map((v, i) => `${i + 1}. "${v.title}": ${v.views.toLocaleString()} views, ${Math.round(v.watchTime)} min watch time, ${v.ctr.toFixed(1)}% CTR, ${v.engagement.toFixed(1)}% engagement`).join("\n")}

Generate a professional summary (3-4 sentences) that:
1. Highlights the key performance metrics
2. Explains the value delivered to the sponsor
3. Provides context on cost efficiency (cost per view, cost per minute)
4. Mentions any standout video performances if applicable

Keep it concise, professional, and data-driven. Do NOT make up metrics or predictions. Only summarize what the data shows.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: "You are a professional YouTube sponsorship performance analyst. Generate concise, data-driven summaries. Never make up metrics or predict future performance. Only summarize what the data shows.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 300,
			temperature: 0.7,
		});

		const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";

		return NextResponse.json({
			success: true,
			summary,
		});
	} catch (error) {
		console.error("[Sponsor Insights] Error:", error);
		// Return a fallback summary if AI fails
		const { performance } = await request.json().catch(() => ({ performance: null }));
		if (performance) {
			return NextResponse.json({
				success: false,
				summary: `This sponsorship generated ${performance.totalViews.toLocaleString()} total views and ${Math.round(performance.totalWatchTime).toLocaleString()} minutes of watch time. The average CTR was ${performance.averageCTR.toFixed(1)}% with ${performance.totalEngagement.toFixed(1)}% engagement rate. Cost per view: $${performance.costPerView.toFixed(3)}. Cost per minute watched: $${performance.costPerMinute.toFixed(2)}.`,
			});
		}
		return NextResponse.json(
			{ error: "Failed to generate insights" },
			{ status: 500 }
		);
	}
}

