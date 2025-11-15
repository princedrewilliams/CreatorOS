import { NextRequest, NextResponse } from "next/server";

// Type definitions for Facebook Graph API responses
interface FacebookPage {
	id: string;
	name?: string;
	instagram_business_account?: {
		id: string;
	};
}

interface FacebookPagesResponse {
	data?: FacebookPage[];
	error?: {
		message: string;
		type: string;
		code: number;
	};
}

interface FacebookTokenResponse {
	access_token?: string;
	error?: {
		message: string;
		type: string;
		code: number;
	};
}

interface InstagramAccountResponse {
	username?: string;
	account_type?: string;
	error?: {
		message: string;
		type: string;
		code: number;
	};
}

export async function POST(request: NextRequest) {
	try {
		const { accessToken } = (await request.json()) as { accessToken?: string };

		if (!accessToken) {
			return NextResponse.json({ success: false, error: "Facebook access token is required" }, { status: 400 });
		}

		// Step 1: Get user's Facebook pages (Instagram Business Accounts are linked to Facebook Pages)
		const pagesResponse = await fetch(
			`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account,id,name`
		);

		if (!pagesResponse.ok) {
			const errorData = (await pagesResponse.json()) as FacebookPagesResponse;
			console.error("Facebook pages API error:", errorData);
			return NextResponse.json(
				{ success: false, error: "Failed to fetch Facebook pages. Make sure you have the required permissions." },
				{ status: 400 }
			);
		}

		const pagesData = (await pagesResponse.json()) as FacebookPagesResponse;
		const pages = pagesData.data || [];

		// Find a page with an Instagram Business Account
		let instagramAccountId: string | null = null;
		let pageAccessToken: string | null = null;

		for (const page of pages) {
			if (page.instagram_business_account) {
				instagramAccountId = page.instagram_business_account.id;
				// Get long-lived page access token
				const tokenResponse = await fetch(
					`https://graph.facebook.com/v18.0/${page.id}?fields=access_token&access_token=${accessToken}`
				);
				if (tokenResponse.ok) {
					const tokenData = (await tokenResponse.json()) as FacebookTokenResponse;
					pageAccessToken = tokenData.access_token || null;
				}
				break;
			}
		}

		if (!instagramAccountId || !pageAccessToken) {
			return NextResponse.json(
				{
					success: false,
					error: "No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook Page.",
				},
				{ status: 400 }
			);
		}

		// Step 2: Get Instagram account info
		const instagramResponse = await fetch(
			`https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,account_type&access_token=${pageAccessToken}`
		);

		if (!instagramResponse.ok) {
			const errorData = await instagramResponse.json();
			console.error("Instagram account API error:", errorData);
			return NextResponse.json(
				{ success: false, error: "Failed to fetch Instagram account information." },
				{ status: 400 }
			);
		}

		const instagramData = (await instagramResponse.json()) as InstagramAccountResponse;

		// Step 3: Exchange for long-lived Instagram token
		// Note: For Instagram Graph API, we use the page access token which already has Instagram permissions
		// The pageAccessToken can be used directly for Instagram API calls

		return NextResponse.json({
			success: true,
			username: instagramData.username || "Instagram User",
			instagramAccessToken: pageAccessToken,
			instagramAccountId: instagramAccountId,
		});
	} catch (error) {
		console.error("Error in Facebook to Instagram token exchange:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to connect Instagram account. Please try again." },
			{ status: 500 }
		);
	}
}

