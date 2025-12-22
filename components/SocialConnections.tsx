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

	// Listen for OAuth success messages from popup windows (YouTube only now)
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			// Only accept messages from same origin
			if (event.origin !== window.location.origin) return;
			
			if (event.data?.type === "oauth_success") {
				const { platform, username, profilePicture } = event.data;
				// Only handle YouTube connections
				if (platform === "youtube") {
					setSocialConnection({
						platform: "youtube",
						connected: true,
						username: username || "YouTube User",
						profilePicture: profilePicture,
					});
				}
			}
		};
		
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [setSocialConnection]);

	// Check for OAuth callback success
	useEffect(() => {
		const connected = searchParams.get("connected");
		const error = searchParams.get("error");

		if (connected) {
			// Update connection status based on OAuth callback (only YouTube supported now)
			const platform = connected as "youtube" | "instagram" | "tiktok";
			// Only handle YouTube connections
			if (platform === "youtube") {
				const username = searchParams.get("username") || "YouTube User";
				const profilePicture = searchParams.get("profilePicture") || undefined;
				setSocialConnection({
					platform,
					connected: true,
					username,
					profilePicture,
				});
			}
			// Clean up URL
			window.history.replaceState({}, "", window.location.pathname);
		}

		if (error) {
			if (error === "youtube_oauth_disabled") {
				alert("YouTube OAuth is disabled in this environment.");
			} else {
				alert(`OAuth error: ${error}`);
			}
			// Clean up URL
			window.history.replaceState({}, "", window.location.pathname);
		}
	}, [searchParams, setSocialConnection]);

	// Refresh TikTok username if it's still showing "TikTok User" or missing
	// Only try once per session to avoid spamming errors
	useEffect(() => {
		const tiktokConnection = socialConnections.find(
			(conn) => conn.platform === "tiktok" && conn.connected && (!conn.username || conn.username === "TikTok User" || conn.username.trim() === "")
		);

		// Check if we've already tried to refresh (to avoid repeated attempts)
		const refreshAttempted = sessionStorage.getItem("tiktok_refresh_attempted");
		if (refreshAttempted === "true" && tiktokConnection) {
			// Already tried, don't try again
			return;
		}

		if (tiktokConnection) {
			// Mark that we've attempted a refresh
			sessionStorage.setItem("tiktok_refresh_attempted", "true");
			
			// Add a small delay to avoid race conditions with other data loading
			const timeoutId = setTimeout(() => {
				// Try to refresh the username from the API
				fetch("/api/auth/tiktok/refresh-username", {
					credentials: "include",
				})
					.then(async (res) => {
						if (!res.ok) {
							// If 401, token might be expired - don't spam errors
							if (res.status === 401) {
								console.warn("[TikTok] Token expired or invalid, user needs to reconnect");
								return null;
							}
							// If 403, scope not authorized - don't show alert repeatedly
							if (res.status === 403) {
								const errorData = await res.json().catch(() => ({}));
								if (errorData.code === "scope_not_authorized") {
									console.warn("[TikTok] Scope not authorized - user needs to reconnect with proper permissions");
									// Don't show alert - user already knows from OAuth error
									return null;
								}
							}
							throw new Error(`HTTP error! status: ${res.status}`);
						}
						// Success - clear the flag so we can try again if needed
						sessionStorage.removeItem("tiktok_refresh_attempted");
						return res.json();
					})
					.then((data) => {
						if (data && data.username && data.username !== "TikTok User" && data.username.trim() !== "") {
							// Preserve existing connection data
							const existingConnection = socialConnections.find((c) => c.platform === "tiktok");
							setSocialConnection({
								platform: "tiktok",
								connected: true,
								username: data.username,
								profilePicture: data.profilePicture,
								accessToken: existingConnection?.accessToken,
								refreshToken: existingConnection?.refreshToken,
								expiresAt: existingConnection?.expiresAt,
								userPlatformId: existingConnection?.userPlatformId,
							});
							console.log("[TikTok] Username refreshed successfully:", data.username);
						}
					})
					.catch((error) => {
						console.error("[TikTok] Failed to refresh username:", error);
					});
			}, 1000); // Wait 1 second after component mounts

			return () => clearTimeout(timeoutId);
		}
	}, [socialConnections, setSocialConnection]);

	const handleConnect = async (platform: "youtube" | "instagram" | "tiktok") => {
		// For YouTube, use normal redirect
		window.location.href = `/api/auth/${platform}`;
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
	];

	const connectedAccounts = socialConnections.filter((conn) => conn.connected && conn.username);

	return (
		<Card size="3" variant="surface" className="p-4 sm:p-6">
			<Heading size="4" as="h2" className="mb-3 sm:mb-4 text-gray-12 dark:text-gray-12 sm:text-5">
				Social Media Connections
			</Heading>
			<Text size="2" color="gray" className="mb-4 text-gray-11 dark:text-gray-11 sm:text-3">
				Connect your social media accounts to enable cross-posting
			</Text>
			{connectedAccounts.length > 0 && (
				<div className="mb-6 p-3 rounded-lg border border-green-a6 bg-green-a2 dark:bg-green-a3">
					<Text size="2" weight="medium" className="mb-2 block text-gray-12 dark:text-gray-12">
						Currently Connected ({connectedAccounts.length})
					</Text>
					<div className="flex flex-wrap gap-2">
						{connectedAccounts.map((conn) => (
							<div
								key={conn.platform}
								className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-a4 border border-green-a6"
							>
								{conn.profilePicture && (
									<img
										src={conn.profilePicture}
										alt={`${conn.username} profile`}
										className="w-5 h-5 rounded-full object-cover"
									/>
								)}
								<Text size="1" weight="medium" className="capitalize text-gray-12 dark:text-gray-12">
									{conn.platform}:
								</Text>
								<Text size="1" className="text-gray-11 dark:text-gray-11 font-mono">
									@{conn.username}
								</Text>
							</div>
						))}
					</div>
				</div>
			)}
			<div className="grid grid-cols-1 gap-3 sm:gap-4">
				{platforms.map((platform) => {
					const connection = socialConnections.find((c: SocialConnection) => c.platform === platform.key);
					const isConnected = connection?.connected || false;
					const isYoutube = platform.key === "youtube";
					// Check OAuth availability (only YouTube supported now)
					const oauthAvailable = isYoutube ? youtubeOAuthEnabled : false;

					return (
						<motion.div
							key={platform.key}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							whileHover={{ scale: 1.01 }}
							className="w-full"
						>
							<Card
								size="3"
								variant="surface"
								className={`p-6 w-full ${
									isConnected ? "border-green-6 bg-green-a2" : "border-gray-a4"
								}`}
							>
								<div className="flex flex-row items-center gap-6 w-full">
									<div className="flex-shrink-0">
										{connection?.profilePicture ? (
											<img
												src={connection.profilePicture}
												alt={`${connection.username || platform.name} profile`}
												className="w-20 h-20 rounded-full object-cover border-2 border-gray-a6"
											/>
										) : (
											<div className="text-6xl">{platform.icon}</div>
										)}
									</div>
									<div className="flex-grow flex flex-col gap-2">
										<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
											{platform.name}
										</Heading>
										{isConnected ? (
											<>
												{connection?.username ? (
													<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
														@{connection.username}
													</Text>
												) : null}
												<Badge color="green" size="2" variant="soft" className="w-fit">
													<CheckIcon className="mr-1" />
													Connected
												</Badge>
											</>
										) : null}
									</div>
									<div className="flex-shrink-0">
										{isConnected ? (
											<Button
												variant="ghost"
												color="red"
												size="3"
												onClick={() => handleDisconnect(platform.key)}
											>
												<Cross2Icon className="mr-1" />
												Disconnect
											</Button>
										) : oauthAvailable ? (
											<Button
												color={platform.color}
												size="3"
												variant="solid"
												onClick={() => handleConnect(platform.key)}
												className="min-w-[180px]"
											>
												Connect {platform.name}
											</Button>
										) : (
											<div className="flex flex-col items-end gap-1">
												<Badge color="yellow" size="2" variant="soft">
													Coming soon
												</Badge>
												<Text size="2" color="gray" className="text-right text-gray-11 dark:text-gray-11">
													{platform.name} integration is coming soon.
												</Text>
											</div>
										)}
									</div>
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

