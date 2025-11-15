"use client";

import { useEffect, Suspense } from "react";
import { Card, Button, Badge, Text, Heading } from "@whop/react/components";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useAppStore, type SocialConnection } from "@/lib/store";
import { useSearchParams } from "next/navigation";

function SocialConnectionsContent() {
	const { socialConnections, setSocialConnection, removeSocialConnection } = useAppStore();
	const searchParams = useSearchParams();
	const youtubeOAuthEnabled = process.env.NEXT_PUBLIC_YOUTUBE_OAUTH_ENABLED === "true";
	const instagramOAuthEnabled = process.env.NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED === "true";

	// Check for OAuth callback success
	useEffect(() => {
		const connected = searchParams.get("connected");
		const error = searchParams.get("error");

		if (connected) {
			// Update connection status based on OAuth callback
			const platform = connected as "youtube" | "instagram" | "tiktok";
			setSocialConnection({
				platform,
				connected: true,
				username: `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
			});
			// Clean up URL
			window.history.replaceState({}, "", window.location.pathname);
		}

		if (error) {
			if (error === "youtube_oauth_disabled") {
				alert("YouTube OAuth is disabled in this environment.");
			} else if (error === "instagram_oauth_disabled") {
				// Instagram can work with access token, so silently mark as connected
				setSocialConnection({
					platform: "instagram",
					connected: true,
					username: "Instagram User",
				});
			} else if (error === "invalid_app_id") {
				alert("Invalid Instagram App ID. Please check your environment variables and ensure you're using the Instagram App ID from Meta App Dashboard (not Facebook App ID).");
			} else if (error === "oauth_init_failed") {
				alert("Failed to initiate Instagram OAuth. Please check:\n1. Instagram product is added to your app\n2. Business Login is configured\n3. Redirect URI is whitelisted in Instagram App settings");
			} else if (error === "invalid_platform_app" || error.includes("platform app")) {
				alert("Invalid platform app error. This usually means:\n1. Instagram product is not added to your Meta App\n2. Business Login is not configured\n3. Wrong Instagram App ID\n\nPlease check your Meta App Dashboard configuration.");
			} else {
				alert(`OAuth error: ${error}`);
			}
			// Clean up URL
			window.history.replaceState({}, "", window.location.pathname);
		}
	}, [searchParams, setSocialConnection]);

	const handleConnect = async (platform: "youtube" | "instagram" | "tiktok") => {
		// Always use OAuth redirect flow (works on both HTTP and HTTPS)
		// Facebook SDK is only used in production with proper HTTPS setup
		window.location.href = `/api/auth/${platform}`;
	};

	const handleInstagramLogin = () => {
		if (typeof window === "undefined" || !window.FB) {
			// Fallback to OAuth redirect if SDK not loaded
			window.location.href = `/api/auth/instagram`;
			return;
		}

		// Only use Facebook SDK on HTTPS
		if (window.location.protocol !== "https:") {
			window.location.href = `/api/auth/instagram`;
			return;
		}

		// Check login status first
		window.FB.getLoginStatus((response: any) => {
			if (response.status === "connected") {
				// Already logged in, exchange for Instagram token
				exchangeFacebookTokenForInstagram(response.authResponse.accessToken);
			} else {
				// Need to login
				window.FB.login(
					(response: any) => {
						if (response.authResponse) {
							exchangeFacebookTokenForInstagram(response.authResponse.accessToken);
						} else {
							alert("Facebook login was cancelled or failed.");
						}
					},
					{
						scope: "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
					}
				);
			}
		}, true); // Force roundtrip to server
	};

	const exchangeFacebookTokenForInstagram = async (facebookAccessToken: string) => {
		try {
			// Exchange Facebook token for Instagram access token via our API
			const response = await fetch("/api/auth/instagram/facebook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ accessToken: facebookAccessToken }),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setSocialConnection({
					platform: "instagram",
					connected: true,
					username: data.username || "Instagram User",
					accessToken: data.instagramAccessToken,
				});
			} else {
				alert(data.error || "Failed to connect Instagram account.");
			}
		} catch (error) {
			console.error("Error exchanging Facebook token:", error);
			alert("Failed to connect Instagram account. Please try again.");
		}
	};

	const handleDisconnect = (platform: "youtube" | "instagram" | "tiktok") => {
		if (confirm(`Are you sure you want to disconnect ${platform}?`)) {
			removeSocialConnection(platform);
		}
	};

	const platforms = [
		{
			name: "YouTube",
			key: "youtube" as const,
			color: "red" as const,
			icon: "📺",
		},
		{
			name: "Instagram",
			key: "instagram" as const,
			color: "purple" as const,
			icon: "📷",
		},
		{
			name: "TikTok",
			key: "tiktok" as const,
			color: "gray" as const,
			icon: "🎵",
		},
	];

	return (
		<Card size="3" variant="surface" className="p-6">
			<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
				Social Media Connections
			</Heading>
			<Text size="3" color="gray" className="mb-6 text-gray-11 dark:text-gray-11">
				Connect your social media accounts to enable cross-posting
			</Text>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{platforms.map((platform) => {
					const connection = socialConnections.find((c: SocialConnection) => c.platform === platform.key);
					const isConnected = connection?.connected || false;
					const isYoutube = platform.key === "youtube";
					const isInstagram = platform.key === "instagram";
					// Check OAuth availability
					// Instagram always available since we can use access token for analytics
					const oauthAvailable = isYoutube 
						? youtubeOAuthEnabled 
						: true; // Instagram and TikTok always available

					return (
						<motion.div
							key={platform.key}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							whileHover={{ scale: 1.02 }}
						>
							<Card
								size="2"
								variant="surface"
								className={`p-4 h-full ${
									isConnected ? "border-green-6 bg-green-a2" : "border-gray-a4"
								}`}
							>
								<div className="flex flex-col items-center gap-3">
									<div className="text-4xl">{platform.icon}</div>
									<Heading size="4" as="h3" className="text-gray-12 dark:text-gray-12">
										{platform.name}
									</Heading>
									{isConnected ? (
										<>
											<Badge color="green" size="2" variant="soft">
												<CheckIcon className="mr-1" />
												Connected
											</Badge>
											{connection?.username && (
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
													@{connection.username}
												</Text>
											)}
											<Button
												variant="ghost"
												color="red"
												size="2"
												onClick={() => handleDisconnect(platform.key)}
											>
												<Cross2Icon className="mr-1" />
												Disconnect
											</Button>
										</>
									) : oauthAvailable ? (
										<Button
											color={platform.color}
											size="2"
											variant="solid"
											onClick={() => handleConnect(platform.key)}
											className="w-full"
										>
											Connect {platform.name}
										</Button>
									) : (
										<Text size="2" color="gray" className="text-center text-gray-11 dark:text-gray-11">
											{platform.name} OAuth is not available in this environment.
										</Text>
									)}
								</div>
							</Card>
						</motion.div>
					);
				})}
			</div>
		</Card>
	);
}

export function SocialConnections() {
	return (
		<Suspense fallback={
			<Card size="3" variant="surface" className="p-6">
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">Loading connections...</Text>
			</Card>
		}>
			<SocialConnectionsContent />
		</Suspense>
	);
}

