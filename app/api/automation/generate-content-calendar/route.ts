import { NextRequest, NextResponse } from "next/server";

interface ContentIdea {
	id: string;
	title: string;
	hook: string;
	caption: string;
	hashtags: string[];
	bestPostTime: string;
	bestPostDay: string;
	estimatedEngagement: string;
	platform: "tiktok" | "instagram" | "youtube";
}

// Mock AI content generation
// In production, use OpenAI, Anthropic, or similar
function generateContentIdeas(niche: string, count: number = 7): ContentIdea[] {
	const ideas: ContentIdea[] = [];
	const platforms: Array<"tiktok" | "instagram" | "youtube"> = ["tiktok", "instagram", "youtube"];
	const hooks = [
		"POV: You just discovered...",
		"This one trick changed everything...",
		"Nobody talks about this but...",
		"If you're struggling with...",
		"3 things I wish I knew earlier...",
		"The secret to...",
		"Stop doing this if you want to...",
	];

	for (let i = 0; i < count; i++) {
		const platform = platforms[i % platforms.length];
		const hook = hooks[i % hooks.length];
		
		ideas.push({
			id: `idea-${i + 1}`,
			title: `${niche} Tip #${i + 1}: Essential Guide`,
			hook: `${hook} ${niche}`,
			caption: `Want to level up your ${niche} game? Here's what you need to know! 💪\n\nFollow for more ${niche} tips!\n\n#${niche.replace(/\s+/g, "")} #tips #creator`,
			hashtags: [niche, `${niche}Tips`, "creator", "viral", "trending"],
			bestPostTime: platform === "tiktok" ? "6:00 PM" : platform === "instagram" ? "7:00 PM" : "3:00 PM",
			bestPostDay: i < 2 ? "Monday" : i < 4 ? "Wednesday" : "Friday",
			estimatedEngagement: `${5 + Math.floor(Math.random() * 10)}%`,
			platform,
		});
	}

	return ideas;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { niche, count = 7 } = body;

		if (!niche) {
			return NextResponse.json(
				{ error: "Niche is required" },
				{ status: 400 }
			);
		}

		// Generate content ideas
		// In production, this would use AI to generate personalized content
		const ideas = generateContentIdeas(niche, count);

		// Generate calendar structure
		const calendar = ideas.map((idea, index) => ({
			...idea,
			scheduledDate: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
			tasks: [
				{
					id: `task-${idea.id}-script`,
					title: `Write script: ${idea.title}`,
					dueDate: new Date(Date.now() + (index - 1) * 24 * 60 * 60 * 1000).toISOString(),
					status: "planned",
				},
				{
					id: `task-${idea.id}-film`,
					title: `Film: ${idea.title}`,
					dueDate: new Date(Date.now() + (index - 0.5) * 24 * 60 * 60 * 1000).toISOString(),
					status: "planned",
				},
				{
					id: `task-${idea.id}-edit`,
					title: `Edit: ${idea.title}`,
					dueDate: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
					status: "planned",
				},
			],
		}));

		return NextResponse.json({
			success: true,
			calendar,
			count: calendar.length,
		});
	} catch (error) {
		console.error("[Generate Content Calendar] Error:", error);
		return NextResponse.json(
			{ error: "Failed to generate content calendar" },
			{ status: 500 }
		);
	}
}

