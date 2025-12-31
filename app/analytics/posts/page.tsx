"use client";

import { useEffect, useState, Suspense } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import type { AnalyticsPlatform } from "@/lib/mockAnalytics";

const formatCompact = (value: number) =>
	new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);

interface Post {
	title: string;
	views: number;
	engagement: number;
	publishedAt: string;
	thumbnail?: string;
	likes?: number;
	comments?: number;
	shares?: number;
	id?: string;
	url?: string;
}

const PLATFORM_META: Record<AnalyticsPlatform, { label: string; color: "red" | "cyan" | "pink" }> = {
	youtube: { label: "YouTube", color: "red" },
};

function PostsContent() {
	const searchParams = useSearchParams();
	const platform = (searchParams.get("platform") || "youtube") as AnalyticsPlatform;
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const meta = PLATFORM_META[platform] || PLATFORM_META.youtube;

	useEffect(() => {
		const fetchPosts = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/posts?platform=${platform}`, {
					credentials: "include",
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error("Failed to load posts");
				}

				const data = await response.json();
				setPosts(data.posts || []);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unexpected error");
				setPosts([]);
			} finally {
				setLoading(false);
			}
		};

		fetchPosts();
	}, [platform]);

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/analytics" />
			</div>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						All {meta.label} Posts
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						View all your {meta.label.toLowerCase()} content with detailed metrics
					</Text>
				</div>
				<Button
					className="flex-shrink-0"
					variant="soft"
					size="2"
					color="gray"
					onClick={() => {
						setLoading(true);
						fetch(`/api/posts?platform=${platform}`, {
							credentials: "include",
							cache: "no-store",
						})
							.then((res) => res.json())
							.then((data) => {
								setPosts(data.posts || []);
								setLoading(false);
							})
							.catch((err) => {
								setError(err.message);
								setLoading(false);
							});
					}}
					disabled={loading}
				>
					<ReloadIcon className="mr-2" />
					Refresh
				</Button>
			</div>

			{error && (
				<Card size="2" variant="surface" className="p-4 border border-red-a6 bg-red-a2">
					<Text size="2" color="red" className="text-red-11 dark:text-red-10">
						{error}
					</Text>
				</Card>
			)}

			{loading ? (
				<Card size="3" variant="surface" className="p-8">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 text-center">
						Loading posts...
					</Text>
				</Card>
			) : posts.length === 0 ? (
				<Card size="3" variant="surface" className="p-8 border-dashed border-gray-a5">
					<Heading size="5" as="h2" className="mb-3 text-gray-12 dark:text-gray-12 text-center">
						No posts found
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 text-center max-w-2xl mx-auto">
						Make sure you're connected to YouTube and have published videos.
					</Text>
				</Card>
			) : (
				<>
					<Card size="2" variant="surface" className="p-4">
						<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
							Showing {posts.length} {posts.length === 1 ? "post" : "posts"}
						</Text>
					</Card>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
						{posts.map((post, index) => (
							<motion.div
								key={post.id || `${post.title}-${index}`}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<Card
									size="2"
									variant="surface"
									className="p-3 sm:p-4 h-full hover:border-gray-a6 dark:hover:border-gray-a5 transition-colors"
								>
									{post.thumbnail ? (
										<div className="mb-3 rounded-lg overflow-hidden aspect-video bg-gray-a3">
											{post.url ? (
												<a href={post.url} target="_blank" rel="noopener noreferrer">
													<img
														src={post.thumbnail}
														alt={post.title}
														className="w-full h-full object-cover hover:scale-105 transition-transform"
													/>
												</a>
											) : (
												<img
													src={post.thumbnail}
													alt={post.title}
													className="w-full h-full object-cover"
												/>
											)}
										</div>
									) : (
										<div
											className="mb-3 rounded-lg aspect-video flex items-center justify-center"
											style={{
												backgroundColor: `var(--${meta.color}-a2)`,
												color: `var(--${meta.color}-11)`,
											}}
										>
											<Text size="2" color="gray">
												No thumbnail
											</Text>
										</div>
									)}

									<div className="space-y-2">
										<Heading size="4" as="h3" className="text-gray-12 dark:text-gray-12 line-clamp-2">
											{post.url ? (
												<a
													href={post.url}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:underline"
												>
													{post.title}
												</a>
											) : (
												post.title
											)}
										</Heading>

										<div className="flex flex-wrap gap-2 items-center">
											<Badge color={meta.color} size="1" variant="soft">
												👁️ {formatCompact(post.views)}
											</Badge>
											<Badge color="green" size="1" variant="soft">
												{post.engagement.toFixed(1)}% engagement
											</Badge>
										</div>

										{(post.likes !== undefined || post.comments !== undefined || post.shares !== undefined) && (
											<div className="flex gap-3 text-sm text-gray-11 dark:text-gray-11">
												{post.likes !== undefined && (
													<span>❤️ {formatCompact(post.likes)}</span>
												)}
												{post.comments !== undefined && (
													<span>💬 {formatCompact(post.comments)}</span>
												)}
												{post.shares !== undefined && (
													<span>🔁 {formatCompact(post.shares)}</span>
												)}
											</div>
										)}

										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
											{new Date(post.publishedAt).toLocaleDateString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</Text>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export default function PostsPage() {
	return (
		<Suspense
			fallback={
				<Card size="3" variant="surface" className="p-8">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 text-center">
						Loading...
					</Text>
				</Card>
			}
		>
			<PostsContent />
		</Suspense>
	);
}

