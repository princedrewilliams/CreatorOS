import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization - only create client when needed
function getOpenAIClient() {
	if (!process.env.OPENAI_API_KEY) {
		return null;
	}
	return new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
}

interface KeyMoment {
	startTime: number; // in seconds
	endTime: number; // in seconds
	title: string;
	description: string;
	reason: string; // Why this is a key moment
}

export async function POST(request: NextRequest) {
	try {
		const openai = getOpenAIClient();
		if (!openai) {
			return NextResponse.json(
				{ error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { videoUrl, videoDuration, clipCount } = body;

		if (!videoUrl) {
			return NextResponse.json(
				{ error: "Video URL is required" },
				{ status: 400 }
			);
		}

		const duration = videoDuration || 300; // Default to 5 minutes if not provided
		const count = Math.min(7, Math.max(3, clipCount || 5));

		// Create system prompt for key moment detection
		const systemPrompt = `You are an expert video content analyzer. Analyze video content and identify key moments that would make engaging short-form clips.
Return ONLY a valid JSON object with a "moments" array. Each moment must have:
- startTime: number (in seconds, must be between 0 and video duration)
- endTime: number (in seconds, must be after startTime, and clip should be 10-20 seconds long)
- title: string (engaging title for the clip)
- description: string (brief description of what happens in this moment)
- reason: string (why this moment is engaging - hook, transition, emotional peak, etc.)

Key moments should be:
- High engagement points (hooks, reveals, reactions)
- Natural transitions or scene changes
- Emotional peaks or climaxes
- Educational or informative highlights
- Visually interesting segments

Ensure clips don't overlap and are evenly distributed throughout the video.`;

		const userPrompt = `Analyze a video (duration: ${duration} seconds) and identify ${count} key moments that would make engaging short-form clips.
Video URL: ${videoUrl}

Return a JSON object with a "moments" array containing ${count} key moments. Each moment should be 10-20 seconds long and represent the most engaging parts of the video.`;

		// Call OpenAI API
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.7,
			max_tokens: 2000,
			response_format: { type: "json_object" },
		});

		const responseContent = completion.choices[0]?.message?.content;
		if (!responseContent) {
			throw new Error("No response from AI");
		}

		// Parse the JSON response
		let parsedResponse: { moments?: KeyMoment[] };
		try {
			parsedResponse = JSON.parse(responseContent);
		} catch (e) {
			throw new Error("Invalid JSON response from AI");
		}

		// Extract and validate moments
		let moments: KeyMoment[] = parsedResponse.moments || [];

		// Validate and normalize moments
		const validatedMoments: KeyMoment[] = moments
			.filter((moment) => {
				return (
					typeof moment.startTime === "number" &&
					typeof moment.endTime === "number" &&
					moment.startTime >= 0 &&
					moment.endTime > moment.startTime &&
					moment.endTime <= duration &&
					moment.title &&
					moment.description
				);
			})
			.map((moment) => {
				// Ensure clip is 10-20 seconds
				const clipDuration = moment.endTime - moment.startTime;
				if (clipDuration < 10) {
					moment.endTime = Math.min(moment.startTime + 15, duration);
				} else if (clipDuration > 20) {
					moment.endTime = moment.startTime + 15;
				}

				return {
					startTime: Math.max(0, Math.min(moment.startTime, duration - 10)),
					endTime: Math.min(moment.endTime, duration),
					title: moment.title || "Key Moment",
					description: moment.description || "",
					reason: moment.reason || "Engaging moment",
				};
			})
			.slice(0, count);

		// If no valid moments, generate fallback moments evenly distributed
		if (validatedMoments.length === 0) {
			const interval = duration / count;
			for (let i = 0; i < count; i++) {
				const startTime = i * interval;
				validatedMoments.push({
					startTime: Math.max(0, startTime),
					endTime: Math.min(startTime + 15, duration),
					title: `Key Moment ${i + 1}`,
					description: `Engaging clip from the video`,
					reason: "Evenly distributed key moment",
				});
			}
		}

		return NextResponse.json({
			success: true,
			moments: validatedMoments,
		});
	} catch (error) {
		console.error("[Detect Key Moments] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to detect key moments" },
			{ status: 500 }
		);
	}
}

