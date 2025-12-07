import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// In-memory store for creator profiles (replace with database in production)
// This stores public creator profiles that are visible in the collab section
const creatorProfiles = new Map<string, any>();

// Mock some initial creators
const initialCreators = [
	{
		userId: "mock-1",
		username: "FitnessGuru",
		niche: "fitness",
		followers: 125000,
		highestViews: 2500000,
		platforms: ["youtube", "instagram"],
		socialLinks: {
			youtube: "https://youtube.com/@fitnessguru",
			instagram: "https://instagram.com/fitnessguru",
		},
	},
	{
		userId: "mock-2",
		username: "ChefMaster",
		niche: "cooking",
		followers: 89000,
		highestViews: 1800000,
		platforms: ["youtube", "tiktok"],
		socialLinks: {
			youtube: "https://youtube.com/@chefmaster",
			tiktok: "https://tiktok.com/@chefmaster",
		},
	},
];

// Initialize with mock data
initialCreators.forEach((creator) => {
	creatorProfiles.set(creator.userId, creator);
});

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		const searchParams = request.nextUrl.searchParams;
		const niche = searchParams.get("niche");

		// Get all creator profiles
		const creators = Array.from(creatorProfiles.values());

		// Filter by niche if specified
		const filteredCreators = niche
			? creators.filter((creator) => creator.niche === niche)
			: creators;

		// Include current user's profile if they have one
		let currentUserProfile = null;
		if (user) {
			// Check if user has a public profile
			const userProfile = creatorProfiles.get(user.whop_user_id);
			if (userProfile) {
				currentUserProfile = userProfile;
			}
		}

		return NextResponse.json({
			success: true,
			creators: filteredCreators,
			currentUserProfile,
		});
	} catch (error) {
		console.error("[Get Creators] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get creators" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { username, niche, socialLinks, followers, highestViews, platforms } = body;

		if (!username || !niche) {
			return NextResponse.json(
				{ error: "Username and niche are required" },
				{ status: 400 }
			);
		}

		// Create or update creator profile
		const creatorProfile = {
			userId: user.whop_user_id,
			username,
			niche,
			followers: followers || 0,
			highestViews: highestViews || 0,
			platforms: platforms || [],
			socialLinks: {
				youtube: socialLinks?.youtube || "",
				instagram: socialLinks?.instagram || "",
				tiktok: socialLinks?.tiktok || "",
			},
			createdAt: creatorProfiles.has(user.whop_user_id)
				? creatorProfiles.get(user.whop_user_id).createdAt
				: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		creatorProfiles.set(user.whop_user_id, creatorProfile);

		return NextResponse.json({
			success: true,
			profile: creatorProfile,
		});
	} catch (error) {
		console.error("[Join Niche] Error:", error);
		return NextResponse.json(
			{ error: "Failed to join niche" },
			{ status: 500 }
		);
	}
}

