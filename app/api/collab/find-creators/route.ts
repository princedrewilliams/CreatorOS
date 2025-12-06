import { NextRequest, NextResponse } from "next/server";

// Mock data - In production, this would query a database or external API
// to find creators based on the criteria
const mockCreators = [
	{
		id: "1",
		username: "fitness_guru",
		platform: "instagram" as const,
		followers: 45000,
		location: "Los Angeles, CA",
		niche: ["fitness", "health", "wellness"],
		audienceOverlap: 65,
		matchScore: 92,
		profilePicture: "https://via.placeholder.com/150",
	},
	{
		id: "2",
		username: "gaming_pro",
		platform: "tiktok" as const,
		followers: 120000,
		location: "New York, NY",
		niche: ["gaming", "entertainment"],
		audienceOverlap: 45,
		matchScore: 78,
		profilePicture: "https://via.placeholder.com/150",
	},
	{
		id: "3",
		username: "beauty_expert",
		platform: "youtube" as const,
		followers: 85000,
		location: "Miami, FL",
		niche: ["beauty", "makeup", "skincare"],
		audienceOverlap: 55,
		matchScore: 85,
		profilePicture: "https://via.placeholder.com/150",
	},
	{
		id: "4",
		username: "fitness_coach",
		platform: "instagram" as const,
		followers: 32000,
		location: "Los Angeles, CA",
		niche: ["fitness", "nutrition"],
		audienceOverlap: 70,
		matchScore: 95,
		profilePicture: "https://via.placeholder.com/150",
	},
	{
		id: "5",
		username: "tech_reviewer",
		platform: "youtube" as const,
		followers: 200000,
		location: "San Francisco, CA",
		niche: ["technology", "reviews"],
		audienceOverlap: 30,
		matchScore: 60,
		profilePicture: "https://via.placeholder.com/150",
	},
];

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { niche, minFollowers, maxFollowers, location, minAudienceOverlap } = body;

		if (!niche) {
			return NextResponse.json(
				{ error: "Niche is required" },
				{ status: 400 }
			);
		}

		// Filter creators based on criteria
		let filtered = mockCreators.filter((creator) => {
			// Check niche match
			const nicheMatch = creator.niche.some((n) =>
				n.toLowerCase().includes(niche.toLowerCase())
			);

			if (!nicheMatch) return false;

			// Check follower range
			if (minFollowers) {
				const min = parseInt(minFollowers);
				if (creator.followers < min) return false;
			}
			if (maxFollowers) {
				const max = parseInt(maxFollowers);
				if (creator.followers > max) return false;
			}

			// Check location
			if (location) {
				const locationMatch = creator.location
					?.toLowerCase()
					.includes(location.toLowerCase());
				if (!locationMatch) return false;
			}

			// Check audience overlap
			const minOverlap = parseInt(minAudienceOverlap || "0");
			if (creator.audienceOverlap < minOverlap) return false;

			return true;
		});

		// Sort by match score (highest first)
		filtered.sort((a, b) => b.matchScore - a.matchScore);

		// In production, you would:
		// 1. Query your database of creators
		// 2. Use APIs from Instagram/TikTok/YouTube to get creator data
		// 3. Calculate audience overlap using analytics data
		// 4. Calculate match scores based on multiple factors

		return NextResponse.json({
			creators: filtered,
			count: filtered.length,
		});
	} catch (error) {
		console.error("[Find Creators] Error:", error);
		return NextResponse.json(
			{ error: "Failed to find creators" },
			{ status: 500 }
		);
	}
}

