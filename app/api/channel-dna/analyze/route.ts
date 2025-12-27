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

interface ChannelData {
	channelName: string;
	channelDescription: string;
	subscriberCount: number;
	totalVideos: number;
	uploadFrequency: string;
	topVideos: Array<{
		title: string;
		views: number;
		length: string;
	}>;
	averageVideoLength: string;
	titleLength: number;
	commonTitlePatterns: string[];
	commonKeywords: string[];
	thumbnailPatterns: {
		hasFaces: boolean;
		hasText: boolean;
		dominantColors: string[];
	};
	contentFormats: {
		shorts: number;
		longForm: number;
	};
	niche: string;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { channelData } = body;

		if (!channelData) {
			return NextResponse.json(
				{ error: "Channel data is required" },
				{ status: 400 }
			);
		}

		const openai = getOpenAIClient();
		if (!openai) {
			return NextResponse.json(
				{ error: "OpenAI API key is not configured" },
				{ status: 500 }
			);
		}

		const data = channelData as ChannelData;

		// Create comprehensive prompt for AI analysis
		const systemPrompt = `You are an expert YouTube channel analyst. Analyze the provided channel data and extract repeatable success patterns. 
Return ONLY a valid JSON object with the following structure:
{
	"summary": "2-3 sentence overview of the channel's strategy",
	"channelPositioning": {
		"niche": "string",
		"targetAudience": "string",
		"uniqueValue": "string"
	},
	"topPerformingContent": {
		"types": ["type1", "type2"],
		"commonElements": ["element1", "element2"],
		"whyItWorks": "explanation"
	},
	"titleStrategy": {
		"patterns": ["pattern1", "pattern2"],
		"length": "optimal length",
		"keywords": ["keyword1", "keyword2"],
		"formula": "title formula description"
	},
	"thumbnailStrategy": {
		"style": "description",
		"elements": ["element1", "element2"],
		"colors": ["color1", "color2"],
		"bestPractices": ["practice1", "practice2"]
	},
	"postingStrategy": {
		"frequency": "description",
		"consistency": "description",
		"optimalTiming": "description"
	},
	"contentLengthStrategy": {
		"optimalLength": "description",
		"formatMix": "description",
		"reasoning": "explanation"
	},
	"audienceTargeting": {
		"signals": ["signal1", "signal2"],
		"engagementPatterns": "description",
		"demographics": "description"
	},
	"whatMakesItWork": [
		"insight1",
		"insight2",
		"insight3"
	],
	"takeaways": [
		"actionable takeaway 1",
		"actionable takeaway 2",
		"actionable takeaway 3",
		"actionable takeaway 4",
		"actionable takeaway 5"
	]
}`;

		const userPrompt = `Analyze this YouTube channel and extract repeatable success patterns:

Channel Name: ${data.channelName}
Description: ${data.channelDescription}
Subscribers: ${data.subscriberCount.toLocaleString()}
Total Videos: ${data.totalVideos}
Upload Frequency: ${data.uploadFrequency}

Top 10 Videos by Views:
${data.topVideos.map((v, i) => `${i + 1}. "${v.title}" - ${v.views.toLocaleString()} views, ${v.length}`).join('\n')}

Average Video Length: ${data.averageVideoLength}
Average Title Length: ${data.titleLength} characters
Common Title Patterns: ${data.commonTitlePatterns.join(', ')}
Common Keywords: ${data.commonKeywords.join(', ')}
Thumbnail Patterns: ${data.thumbnailPatterns.hasFaces ? 'Faces present' : 'No faces'}, ${data.thumbnailPatterns.hasText ? 'Text present' : 'No text'}, Colors: ${data.thumbnailPatterns.dominantColors.join(', ')}
Content Formats: ${data.contentFormats.shorts} Shorts, ${data.contentFormats.longForm} Long-form
Niche: ${data.niche}

Provide a deep analysis focusing on actionable insights that creators can apply to their own channels.`;

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

		const analysis = JSON.parse(responseContent);

		return NextResponse.json({
			success: true,
			analysis,
		});
	} catch (error) {
		console.error("[Channel DNA] Error:", error);
		return NextResponse.json(
			{ error: "Failed to analyze channel", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

