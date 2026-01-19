// Learning Lab - Main Orchestrator API

import { NextResponse } from "next/server";
import {
	resolveChannelId,
	fetchChannel,
	fetchRecentVideos,
	fetchCommentsForVideos,
} from "@/lib/youtube/fetcher";
import { analyzePillars } from "@/lib/learning-lab/pillar-analyzer";
import { analyzePackaging } from "@/lib/learning-lab/packaging-analyzer";
import { analyzeCommunity } from "@/lib/learning-lab/community-analyzer";
import { requirePro } from "@/lib/paywall";
import type { LearningLabResponse } from "@/lib/learning-lab/types";

export async function POST(req: Request) {
	try {
		// Pro feature check - temporarily disabled for testing
		// const { allowed, reason } = await requirePro("learning-lab");
		// if (!allowed) {
		// 	return NextResponse.json(
		// 		{ error: reason, requiresPro: true },
		// 		{ status: 403 }
		// 	);
		// }

		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();
		const userNiche = body?.userNiche?.trim() || "";
		const modules = body?.modules || ["pillars", "packaging", "community"];

		if (!channelUrl) {
			return NextResponse.json(
				{ error: "channelUrl is required" },
				{ status: 400 }
			);
		}

		// Resolve channel ID
		const channelId = await resolveChannelId(channelUrl);
		const channel = await fetchChannel(channelId);

		if (!channel.uploadsPlaylistId) {
			throw new Error("Could not find uploads playlist for this channel.");
		}

		// Fetch 100 videos with descriptions and tags
		const videos = await fetchRecentVideos(channel.uploadsPlaylistId, {
			maxResults: 100,
			includeDescription: true,
			includeTags: true,
		});

		// Run selected modules in parallel
		const modulePromises: Promise<any>[] = [];
		const moduleNames: string[] = [];

		if (modules.includes("pillars")) {
			moduleNames.push("pillars");
			modulePromises.push(analyzePillars(videos));
		}

		if (modules.includes("packaging")) {
			moduleNames.push("packaging");
			modulePromises.push(analyzePackaging(videos, 10));
		}

		if (modules.includes("community")) {
			moduleNames.push("community");
			// Get top 5 videos by views for comment analysis
			const topVideos = [...videos]
				.sort((a, b) => (b.views || 0) - (a.views || 0))
				.slice(0, 5);
			const topVideoIds = topVideos.map((v) => v.id);

			// Fetch comments for top videos
			modulePromises.push(
				fetchCommentsForVideos(topVideoIds, 50).then((comments) =>
					analyzeCommunity(comments, videos)
				)
			);
		}

		// Wait for all modules
		const results = await Promise.all(modulePromises);

		// Map results back to module names
		const moduleResults: Record<string, any> = {};
		moduleNames.forEach((name, index) => {
			moduleResults[name] = results[index];
		});

		// Generate overall insights
		const overallInsights = generateOverallInsights(moduleResults, userNiche);

		const response: LearningLabResponse = {
			channel,
			pillars: moduleResults.pillars,
			packaging: moduleResults.packaging,
			community: moduleResults.community,
			overallInsights,
			fetchedAt: new Date().toISOString(),
			videosAnalyzed: videos.length,
		};

		return NextResponse.json(response);
	} catch (err) {
		console.error("Learning Lab error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

function generateOverallInsights(
	results: Record<string, any>,
	_userNiche: string
): {
	growthOpportunity: string;
	contentStrategy: string;
	packagingAdvice: string;
} {
	const pillars = results.pillars;
	const packaging = results.packaging;
	const community = results.community;

	// Growth opportunity
	let growthOpportunity = "Analyze your top-performing content to identify replicable patterns.";
	if (pillars?.analysis?.growthDriver) {
		growthOpportunity = `Your ${pillars.analysis.growthDriver} content is your growth driver. Consider doubling down on this format.`;
	}
	if (community?.contentGaps?.length > 0) {
		const topGap = community.contentGaps[0];
		growthOpportunity += ` Audience is asking about "${topGap.theme}" - consider creating content to fill this gap.`;
	}

	// Content strategy
	let contentStrategy = "Maintain consistent upload schedule and topic focus.";
	if (pillars?.formatBreakdown) {
		const format = pillars.formatBreakdown;
		if (format.shorts.percentage < 20 && format.shorts.avgViews > format.longForm.avgViews) {
			contentStrategy = "Shorts are underutilized but perform well. Consider increasing short-form content.";
		} else if (format.shorts.percentage > 60 && format.longForm.avgViews > format.shorts.avgViews) {
			contentStrategy = "Long-form outperforms Shorts. Consider rebalancing toward longer content.";
		}
	}

	// Packaging advice
	let packagingAdvice = "Test different title hooks and thumbnail styles to optimize CTR.";
	if (packaging?.titlePsychology) {
		const avgScore = packaging.titlePsychology.avgHookScore;
		if (avgScore < 50) {
			packagingAdvice = "Titles lack psychological hooks. Add curiosity, numbers, or questions to increase CTR.";
		} else if (avgScore > 70) {
			packagingAdvice = "Strong title psychology. Focus on thumbnail optimization for next level growth.";
		}
	}

	return {
		growthOpportunity,
		contentStrategy,
		packagingAdvice,
	};
}
