"use client";

import { useState, useEffect } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { PersonIcon, Pencil1Icon, VideoIcon, Link2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

const NICHE_CATEGORIES = [
	{ id: "fitness", label: "Fitness", icon: "💪", color: "red" as const },
	{ id: "cooking", label: "Cooking", icon: "👨‍🍳", color: "orange" as const },
	{ id: "streamer", label: "Streamer", icon: "🎮", color: "purple" as const },
	{ id: "gamer", label: "Gamer", icon: "🎯", color: "blue" as const },
	{ id: "beauty", label: "Beauty", icon: "💄", color: "pink" as const },
	{ id: "tech", label: "Tech", icon: "💻", color: "cyan" as const },
	{ id: "travel", label: "Travel", icon: "✈️", color: "green" as const },
	{ id: "lifestyle", label: "Lifestyle", icon: "🌟", color: "amber" as const },
];

// Validation functions for social media links
function isValidYouTubeUrl(url: string): boolean {
	if (!url) return true; // Empty is valid
	const urlLower = url.toLowerCase();
	return urlLower.includes("youtube.com") || urlLower.includes("youtu.be");
}

function isValidInstagramUrl(url: string): boolean {
	if (!url) return true; // Empty is valid
	const urlLower = url.toLowerCase();
	return urlLower.includes("instagram.com") || urlLower.includes("instagr.am");
}

function isValidTikTokUrl(url: string): boolean {
	if (!url) return true; // Empty is valid
	const urlLower = url.toLowerCase();
	return urlLower.includes("tiktok.com");
}

export default function ProfilePage() {
	const { user, socialConnections } = useAppStore();
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [socialLinkErrors, setSocialLinkErrors] = useState({
		youtube: "",
		instagram: "",
		tiktok: "",
	});
	const [profile, setProfile] = useState({
		username: user?.whop_username || "",
		niche: "",
		bio: "",
		profilePicture: "",
		socialLinks: {
			youtube: "",
			instagram: "",
			tiktok: "",
		},
	});

	useEffect(() => {
		if (!user) {
			router.push("/login?redirect=/profile");
			return;
		}

		// Load user profile data
		const loadProfile = async () => {
			try {
				const [profileResponse, pictureResponse] = await Promise.all([
					fetch("/api/user/profile", { credentials: "include" }),
					fetch("/api/user/profile/picture", { credentials: "include" }),
				]);
				
				if (profileResponse.ok) {
					const data = await profileResponse.json();
					if (data.profile) {
						setProfile((prev) => ({ ...prev, ...data.profile }));
					}
				}
				
				if (pictureResponse.ok) {
					const pictureData = await pictureResponse.json();
					if (pictureData.profilePictureUrl) {
						setProfile((prev) => ({ ...prev, profilePicture: pictureData.profilePictureUrl }));
					}
				}
			} catch (err) {
				console.error("Failed to load profile:", err);
			}
		};

		loadProfile();
	}, [user, router]);

	const handleSave = async () => {
		// Validate social links before saving
		if (profile.socialLinks.youtube && !isValidYouTubeUrl(profile.socialLinks.youtube)) {
			alert("Please enter a valid YouTube URL");
			return;
		}
		if (profile.socialLinks.instagram && !isValidInstagramUrl(profile.socialLinks.instagram)) {
			alert("Please enter a valid Instagram URL");
			return;
		}
		if (profile.socialLinks.tiktok && !isValidTikTokUrl(profile.socialLinks.tiktok)) {
			alert("Please enter a valid TikTok URL");
			return;
		}

		try {
			const response = await fetch("/api/user/profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(profile),
			});

			if (response.ok) {
				// Also save profile picture if provided
				if (profile.profilePicture) {
					await fetch("/api/user/profile/picture", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ profilePictureUrl: profile.profilePicture }),
					});
				}
				setIsEditing(false);
				setSocialLinkErrors({ youtube: "", instagram: "", tiktok: "" });
				alert("Profile updated successfully!");
			} else {
				alert("Failed to update profile");
			}
		} catch (err) {
			console.error("Failed to save profile:", err);
			alert("Failed to save profile");
		}
	};

	// Get stats from social connections
	const stats = {
		followers: socialConnections.reduce((sum, conn) => {
			// Mock follower count - in production, fetch from API
			return sum + (conn.connected ? 10000 : 0);
		}, 0),
		highestViews: 2500000, // Mock - in production, fetch from analytics
		totalVideos: 150, // Mock - in production, fetch from content library
	};

	if (!user) {
		return null;
	}

	const nicheInfo = NICHE_CATEGORIES.find((n) => n.id === profile.niche);

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						My Profile
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Manage your creator profile and showcase your stats
					</Text>
				</div>
				<Button
					variant={isEditing ? "soft" : "solid"}
					color="blue"
					size="3"
					onClick={() => {
						if (isEditing) {
							handleSave();
						} else {
							setIsEditing(true);
						}
					}}
				>
					<Pencil1Icon className="mr-2" />
					{isEditing ? "Save Profile" : "Edit Profile"}
				</Button>
			</div>

			{/* Profile Card */}
			<Card size="3" variant="surface" className="p-6">
				<div className="flex items-start gap-6 mb-6">
					<div className="relative">
						<div className="w-24 h-24 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0 overflow-hidden">
							{profile.profilePicture ? (
								<img
									src={profile.profilePicture}
									alt={profile.username || user.whop_username}
									className="w-full h-full object-cover"
								/>
							) : (
								<PersonIcon className="w-12 h-12 text-gray-11" />
							)}
						</div>
						{isEditing && (
							<label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-9 flex items-center justify-center cursor-pointer hover:bg-blue-10 transition-colors">
								<Pencil1Icon className="w-4 h-4 text-white" />
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={async (e) => {
										const file = e.target.files?.[0];
										if (file) {
											// Convert to data URL for preview
											const reader = new FileReader();
											reader.onloadend = () => {
												const dataUrl = reader.result as string;
												setProfile({ ...profile, profilePicture: dataUrl });
												// Save to server
												fetch("/api/user/profile/picture", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													credentials: "include",
													body: JSON.stringify({ profilePictureUrl: dataUrl }),
												}).catch(console.error);
											};
											reader.readAsDataURL(file);
										}
									}}
								/>
							</label>
						)}
					</div>
					<div className="flex-1">
						{isEditing ? (
							<div className="space-y-4">
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Profile Picture URL
									</Text>
									<input
										type="url"
										value={profile.profilePicture}
										onChange={(e) => setProfile({ ...profile, profilePicture: e.target.value })}
										placeholder="https://example.com/your-picture.jpg"
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 mb-2"
									/>
									<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mb-4">
										Or click the camera icon on your profile picture to upload
									</Text>
								</div>
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Username
									</Text>
									<input
										type="text"
										value={profile.username}
										onChange={(e) => setProfile({ ...profile, username: e.target.value })}
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
									/>
								</div>
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Select Niche
									</Text>
									<div className="grid grid-cols-4 gap-2">
										{NICHE_CATEGORIES.map((niche) => (
											<Button
												key={niche.id}
												variant={profile.niche === niche.id ? "soft" : "ghost"}
												color={profile.niche === niche.id ? niche.color : "gray"}
												size="2"
												onClick={() => setProfile({ ...profile, niche: niche.id })}
												className="flex flex-col items-center gap-1 h-auto py-3"
											>
												<Text size="4">{niche.icon}</Text>
												<Text size="1">{niche.label}</Text>
											</Button>
										))}
									</div>
								</div>
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Bio
									</Text>
									<textarea
										value={profile.bio}
										onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
										placeholder="Tell us about yourself..."
										rows={4}
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
									/>
								</div>
							</div>
						) : (
							<div>
								<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12 mb-2">
									{profile.username || user.whop_username}
								</Heading>
								{nicheInfo && (
									<Badge color={nicheInfo.color} size="2" variant="soft" className="mb-3">
										{nicheInfo.icon} {nicheInfo.label}
									</Badge>
								)}
								{profile.bio && (
									<Text size="3" className="text-gray-11 dark:text-gray-11">
										{profile.bio}
									</Text>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
					<Card size="2" variant="surface" className="p-4">
						<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
							Total Followers
						</Text>
						<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
							{new Intl.NumberFormat("en", { notation: "compact" }).format(stats.followers)}
						</Heading>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
							Highest Viewed Video
						</Text>
						<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
							{new Intl.NumberFormat("en", { notation: "compact" }).format(stats.highestViews)} views
						</Heading>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
							Total Videos
						</Text>
						<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
							{stats.totalVideos}
						</Heading>
					</Card>
				</div>

				{/* Social Media Links */}
				<div>
					<Text size="2" weight="medium" className="mb-3 text-gray-12 dark:text-gray-12">
						Social Media Links
					</Text>
					<div className="space-y-2">
						{isEditing ? (
							<>
								<div>
									<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
										YouTube URL
									</Text>
									<input
										type="url"
										value={profile.socialLinks.youtube}
										onChange={(e) => {
											const value = e.target.value;
											if (value && !isValidYouTubeUrl(value)) {
												setSocialLinkErrors(prev => ({ ...prev, youtube: "Please enter a valid YouTube URL" }));
											} else {
												setSocialLinkErrors(prev => ({ ...prev, youtube: "" }));
											}
											setProfile({
												...profile,
												socialLinks: { ...profile.socialLinks, youtube: value },
											});
										}}
										placeholder="https://youtube.com/@yourchannel"
										className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 ${
											socialLinkErrors.youtube ? "border-red-9 dark:border-red-9" : "border-gray-a6 dark:border-gray-a7"
										}`}
									/>
									{socialLinkErrors.youtube && (
										<Text size="1" className="text-red-11 mt-1">
											{socialLinkErrors.youtube}
										</Text>
									)}
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
										Instagram URL
									</Text>
									<input
										type="url"
										value={profile.socialLinks.instagram}
										onChange={(e) => {
											const value = e.target.value;
											if (value && !isValidInstagramUrl(value)) {
												setSocialLinkErrors(prev => ({ ...prev, instagram: "Please enter a valid Instagram URL" }));
											} else {
												setSocialLinkErrors(prev => ({ ...prev, instagram: "" }));
											}
											setProfile({
												...profile,
												socialLinks: { ...profile.socialLinks, instagram: value },
											});
										}}
										placeholder="https://instagram.com/yourhandle"
										className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 ${
											socialLinkErrors.instagram ? "border-red-9 dark:border-red-9" : "border-gray-a6 dark:border-gray-a7"
										}`}
									/>
									{socialLinkErrors.instagram && (
										<Text size="1" className="text-red-11 mt-1">
											{socialLinkErrors.instagram}
										</Text>
									)}
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
										TikTok URL
									</Text>
									<input
										type="url"
										value={profile.socialLinks.tiktok}
										onChange={(e) => {
											const value = e.target.value;
											if (value && !isValidTikTokUrl(value)) {
												setSocialLinkErrors(prev => ({ ...prev, tiktok: "Please enter a valid TikTok URL" }));
											} else {
												setSocialLinkErrors(prev => ({ ...prev, tiktok: "" }));
											}
											setProfile({
												...profile,
												socialLinks: { ...profile.socialLinks, tiktok: value },
											});
										}}
										placeholder="https://tiktok.com/@yourhandle"
										className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 ${
											socialLinkErrors.tiktok ? "border-red-9 dark:border-red-9" : "border-gray-a6 dark:border-gray-a7"
										}`}
									/>
									{socialLinkErrors.tiktok && (
										<Text size="1" className="text-red-11 mt-1">
											{socialLinkErrors.tiktok}
										</Text>
									)}
								</div>
							</>
						) : (
							<>
								{profile.socialLinks.youtube && (
									<Button
										variant="ghost"
										size="2"
										asChild
										className="w-full justify-start"
									>
										<a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
											<VideoIcon className="mr-2" />
											YouTube
											<Link2Icon className="ml-auto" />
										</a>
									</Button>
								)}
								{profile.socialLinks.instagram && (
									<Button
										variant="ghost"
										size="2"
										asChild
										className="w-full justify-start"
									>
										<a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
											📷 Instagram
											<Link2Icon className="ml-auto" />
										</a>
									</Button>
								)}
								{profile.socialLinks.tiktok && (
									<Button
										variant="ghost"
										size="2"
										asChild
										className="w-full justify-start"
									>
										<a href={profile.socialLinks.tiktok} target="_blank" rel="noopener noreferrer">
											🎵 TikTok
											<Link2Icon className="ml-auto" />
										</a>
									</Button>
								)}
								{!profile.socialLinks.youtube && !profile.socialLinks.instagram && !profile.socialLinks.tiktok && (
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										No social media links added. Click "Edit Profile" to add them.
									</Text>
								)}
							</>
						)}
					</div>
				</div>
			</Card>
		</div>
	);
}

