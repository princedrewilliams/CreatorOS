import { NextResponse } from "next/server";

interface ChannelSummaryRequest {
	channelName: string;
	channelId: string;
	score: {
		total: number;
		categories: Record<string, number>;
		strengths: { category: string; score: number }[];
		weaknesses: { category: string; score: number }[];
	};
	metrics: {
		postingFrequency: string;
		averageTitleLength: number;
		commonKeywords: { word: string; count: number }[];
	};
	videos: { views?: number; likes?: number; comments?: number }[];
}

interface ChannelSummary {
	snapshot: {
		name: string;
		niche: string;
		sizeTier: string;
		healthScore: number;
		confidence: "high" | "medium" | "low";
	};
	whatsWorking: string[];
	whatsHurting: string[];
	patternDiagnosis: string;
	confidenceLevel: "high" | "medium" | "low";
}

function getConfidence(videoCount: number): "high" | "medium" | "low" {
	if (videoCount >= 20) return "high";
	if (videoCount >= 10) return "medium";
	return "low";
}

function generateSummary(data: ChannelSummaryRequest): ChannelSummary {
	const { channelName, score, metrics, videos } = data;

	// Determine niche from keywords
	const niche = metrics.commonKeywords.length > 0
		? metrics.commonKeywords.slice(0, 3).map(k => k.word).join(", ")
		: "General content";

	// Calculate confidence based on video count
	const confidence = getConfidence(videos.length);

	// What's working (top 3 strengths with score >= 60)
	const whatsWorking: string[] = [];
	for (const strength of score.strengths) {
		if (strength.score >= 60 && whatsWorking.length < 3) {
			switch (strength.category) {
				case "Viral Potential":
					whatsWorking.push(`Strong viral potential (${strength.score}/100) - videos consistently reach beyond subscriber base`);
					break;
				case "Audience Engagement":
					whatsWorking.push(`High engagement rate (${strength.score}/100) - audience actively interacts with content`);
					break;
				case "Discoverability / SEO":
					whatsWorking.push(`Good SEO practices (${strength.score}/100) - titles and descriptions optimized for search`);
					break;
				case "Upload Consistency":
					whatsWorking.push(`Consistent upload schedule (${strength.score}/100) - ${metrics.postingFrequency} cadence maintained`);
					break;
				case "Thumbnail Performance":
					whatsWorking.push(`Strong thumbnail strategy (${strength.score}/100) - visual branding is consistent`);
					break;
				case "Channel Identity & Focus":
					whatsWorking.push(`Clear channel identity (${strength.score}/100) - focused positioning in ${niche}`);
					break;
				default:
					whatsWorking.push(`${strength.category}: ${strength.score}/100`);
			}
		}
	}

	// What's hurting (bottom 3 weaknesses with score < 50)
	const whatsHurting: string[] = [];
	for (const weakness of score.weaknesses) {
		if (weakness.score < 50 && whatsHurting.length < 3) {
			switch (weakness.category) {
				case "Viral Potential":
					whatsHurting.push(`Low viral repeatability (${weakness.score}/100) - most videos underperform channel median`);
					break;
				case "Audience Engagement":
					whatsHurting.push(`Weak engagement signals (${weakness.score}/100) - low comment and like rates`);
					break;
				case "Discoverability / SEO":
					whatsHurting.push(`Poor discoverability (${weakness.score}/100) - inconsistent keyword strategy`);
					break;
				case "Upload Consistency":
					whatsHurting.push(`Irregular uploads (${weakness.score}/100) - ${metrics.postingFrequency} hurts algorithmic favor`);
					break;
				case "Thumbnail Performance":
					whatsHurting.push(`Inconsistent thumbnails (${weakness.score}/100) - visual branding varies too much`);
					break;
				case "Channel Identity & Focus":
					whatsHurting.push(`Unclear positioning (${weakness.score}/100) - content lacks focused identity`);
					break;
				default:
					whatsHurting.push(`${weakness.category}: ${weakness.score}/100 - needs improvement`);
			}
		}
	}

	// If no clear weaknesses, add a neutral message
	if (whatsHurting.length === 0) {
		whatsHurting.push("No critical issues detected - focus on optimizing existing strengths");
	}

	// Pattern diagnosis
	let patternDiagnosis = "";

	if (score.total >= 75) {
		patternDiagnosis = `${channelName} demonstrates strong fundamentals with ${metrics.postingFrequency.toLowerCase()} uploads and clear topic focus around ${niche}. The channel's ${score.strengths[0]?.category || "overall performance"} is particularly notable. To accelerate growth, double down on what's working while maintaining consistency.`;
	} else if (score.total >= 50) {
		patternDiagnosis = `${channelName} shows potential but has room for improvement. The ${metrics.postingFrequency.toLowerCase()} upload cadence is ${metrics.postingFrequency.includes("Weekly") ? "adequate" : "limiting growth"}. Focus on addressing ${score.weaknesses[0]?.category || "weak areas"} while leveraging strength in ${score.strengths[0]?.category || "key areas"}.`;
	} else {
		patternDiagnosis = `${channelName} has significant opportunities for improvement. The data suggests inconsistency in ${score.weaknesses[0]?.category || "multiple areas"}. Prioritize establishing a regular upload schedule and narrowing topic focus before scaling content production.`;
	}

	return {
		snapshot: {
			name: channelName,
			niche,
			sizeTier: "Unknown", // Would need subscriber count
			healthScore: score.total,
			confidence,
		},
		whatsWorking,
		whatsHurting,
		patternDiagnosis,
		confidenceLevel: confidence,
	};
}

function generateCSV(summary: ChannelSummary): string {
	const rows = [
		["Channel Summary Report"],
		[""],
		["Snapshot"],
		["Name", summary.snapshot.name],
		["Niche", summary.snapshot.niche],
		["Health Score", summary.snapshot.healthScore.toString()],
		["Confidence", summary.snapshot.confidence],
		[""],
		["What's Working"],
		...summary.whatsWorking.map((item, i) => [`${i + 1}`, item]),
		[""],
		["What's Hurting Growth"],
		...summary.whatsHurting.map((item, i) => [`${i + 1}`, item]),
		[""],
		["Pattern Diagnosis"],
		[summary.patternDiagnosis],
	];

	return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

function generateMarkdown(summary: ChannelSummary): string {
	return `# Channel Summary: ${summary.snapshot.name}

## Snapshot
- **Niche:** ${summary.snapshot.niche}
- **Health Score:** ${summary.snapshot.healthScore}/100
- **Confidence:** ${summary.snapshot.confidence}

## What's Working
${summary.whatsWorking.map(item => `- ${item}`).join("\n")}

## What's Hurting Growth
${summary.whatsHurting.map(item => `- ${item}`).join("\n")}

## Pattern Diagnosis
${summary.patternDiagnosis}

---
*Generated by CreatorOS*
`;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { format, ...data } = body as ChannelSummaryRequest & { format?: "json" | "csv" | "markdown" };

		const summary = generateSummary(data);

		if (format === "csv") {
			return new NextResponse(generateCSV(summary), {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="${summary.snapshot.name.replace(/[^a-zA-Z0-9]/g, "_")}_summary.csv"`,
				},
			});
		}

		if (format === "markdown") {
			return new NextResponse(generateMarkdown(summary), {
				headers: {
					"Content-Type": "text/markdown",
					"Content-Disposition": `attachment; filename="${summary.snapshot.name.replace(/[^a-zA-Z0-9]/g, "_")}_summary.md"`,
				},
			});
		}

		return NextResponse.json(summary);
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to generate summary" },
			{ status: 500 }
		);
	}
}
