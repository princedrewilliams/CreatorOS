"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, ExternalLinkIcon, FileTextIcon, DownloadIcon, Share1Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useAppStore, type SponsorDeal } from "@/lib/store";
import { BackButton } from "@/components/BackButton";

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const formatCompact = (value: number) =>
	new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);

interface VideoPerformance {
	videoId: string;
	title: string;
	views: number;
	watchTime: number; // minutes
	ctr: number; // percentage
	avgViewDuration: number; // seconds
	likes: number;
	comments: number;
	engagement: number; // percentage
	thumbnail?: string;
}

interface SponsorPerformance {
	totalViews: number;
	totalWatchTime: number;
	averageCTR: number;
	totalEngagement: number;
	costPerView: number;
	costPerMinute: number;
	videos: VideoPerformance[];
}

export default function SponsorDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { sponsors, removeSponsor } = useAppStore();
	const [performance, setPerformance] = useState<SponsorPerformance | null>(null);
	const [loading, setLoading] = useState(true);
	const [aiSummary, setAiSummary] = useState<string | null>(null);
	const [loadingSummary, setLoadingSummary] = useState(false);

	const sponsor = useMemo(() => {
		return sponsors.find((s) => s.id === params.id as string);
	}, [sponsors, params.id]);

	useEffect(() => {
		if (!sponsor) {
			router.push("/sponsors");
			return;
		}

		const fetchPerformance = async () => {
			if (!sponsor.youtubeVideoIds || sponsor.youtubeVideoIds.length === 0) {
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`/api/sponsors/${sponsor.id}/performance`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						videoIds: sponsor.youtubeVideoIds,
					}),
				});

				if (response.ok) {
					const data = await response.json();
					// Calculate cost per view and cost per minute
					const dealValue = getDealValue(sponsor);
					const performanceWithCosts = {
						...data,
						costPerView: data.totalViews > 0 ? dealValue / data.totalViews : 0,
						costPerMinute: data.totalWatchTime > 0 ? dealValue / data.totalWatchTime : 0,
					};
					setPerformance(performanceWithCosts);
				}
			} catch (error) {
				console.error("Failed to fetch sponsor performance:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchPerformance();
	}, [sponsor, router]);

	useEffect(() => {
		if (performance && sponsor) {
			const fetchSummary = async () => {
				setLoadingSummary(true);
				try {
					const response = await fetch("/api/sponsors/insights", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							sponsorId: sponsor.id,
							performance,
							dealValue: sponsor.dealValue || sponsor.amount || 0,
						}),
					});

					if (response.ok) {
						const data = await response.json();
						setAiSummary(data.summary || null);
					}
				} catch (error) {
					console.error("Failed to fetch AI summary:", error);
				} finally {
					setLoadingSummary(false);
				}
			};

			fetchSummary();
		}
	}, [performance, sponsor]);

	if (!sponsor) {
		return null;
	}

	const getSponsorName = (deal: SponsorDeal) => deal.name || deal.brand || "Unknown Sponsor";
	const getDealValue = (deal: SponsorDeal) => deal.dealValue || deal.amount || 0;

	const handleExportReport = async () => {
		try {
			const response = await fetch(`/api/sponsors/${sponsor.id}/export`, {
				credentials: "include",
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `sponsor-report-${sponsor.id}.pdf`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error("Failed to export report:", error);
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/sponsors" />
			</div>

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						{getSponsorName(sponsor)}
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Sponsor deal details and performance metrics
					</Text>
				</div>
				<div className="flex gap-2">
					<Button variant="ghost" size="2" color="blue" onClick={handleExportReport}>
						<DownloadIcon className="mr-2" />
						Export Report
					</Button>
				</div>
			</div>

			{/* Deal Overview */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Deal Overview
				</Heading>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
							Deal Value
						</Text>
						<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
							{currencyFormatter.format(getDealValue(sponsor))}
						</Heading>
					</div>
					<div>
						<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
							Status
						</Text>
						<Badge color={sponsor.status === "active" ? "green" : sponsor.status === "completed" ? "gray" : "blue"} variant="soft" size="2">
							{sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
						</Badge>
					</div>
					<div>
						<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
							Payment Status
						</Text>
						<Badge color={sponsor.paymentStatus === "paid" ? "green" : sponsor.paymentStatus === "partially_paid" ? "amber" : "red"} variant="soft" size="2">
							{sponsor.paymentStatus === "partially_paid" ? "Partially Paid" : sponsor.paymentStatus === "unpaid" ? "Unpaid" : "Paid"}
						</Badge>
					</div>
					{sponsor.contactEmail && (
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Contact Email
							</Text>
							<Text size="3" className="text-gray-12 dark:text-gray-12">
								{sponsor.contactEmail}
							</Text>
						</div>
					)}
					{sponsor.deliverables && (
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Deliverables
							</Text>
							<Text size="3" className="text-gray-12 dark:text-gray-12">
								{sponsor.deliverables}
							</Text>
						</div>
					)}
					{sponsor.endDate && (
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								End Date
							</Text>
							<Text size="3" className="text-gray-12 dark:text-gray-12">
								{new Date(sponsor.endDate).toLocaleDateString()}
							</Text>
						</div>
					)}
				</div>
				{sponsor.notes && (
					<div className="mt-4 pt-4 border-t border-gray-a4 dark:border-gray-a6">
						<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
							Notes
						</Text>
						<Text size="3" className="text-gray-12 dark:text-gray-12">
							{sponsor.notes}
						</Text>
					</div>
				)}
			</Card>

			{/* Performance Summary */}
			{loading ? (
				<Card size="3" variant="surface" className="p-6">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						Loading performance data...
					</Text>
				</Card>
			) : performance && performance.videos.length > 0 ? (
				<>
					<Card size="3" variant="surface" className="p-6">
						<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
							Sponsor Performance Summary
						</Heading>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
							<div>
								<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
									Total Views
								</Text>
								<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
									{formatCompact(performance.totalViews)}
								</Heading>
							</div>
							<div>
								<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
									Watch Time
								</Text>
								<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
									{formatCompact(performance.totalWatchTime)} min
								</Heading>
							</div>
							<div>
								<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
									Avg CTR
								</Text>
								<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
									{performance.averageCTR.toFixed(1)}%
								</Heading>
							</div>
							<div>
								<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
									Engagement
								</Text>
								<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
									{performance.totalEngagement.toFixed(1)}%
								</Heading>
							</div>
							<div>
								<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
									Cost/View
								</Text>
								<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
									${performance.costPerView.toFixed(3)}
								</Heading>
							</div>
							<div>
								<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
									Cost/Minute
								</Text>
								<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
									${performance.costPerMinute.toFixed(2)}
								</Heading>
							</div>
						</div>

						{/* AI Summary */}
						{loadingSummary ? (
							<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
								Generating performance summary...
							</Text>
						) : aiSummary ? (
							<div className="mt-4 pt-4 border-t border-gray-a4 dark:border-gray-a6">
								<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
									Performance Summary
								</Text>
								<Text size="3" className="text-gray-12 dark:text-gray-12 whitespace-pre-line">
									{aiSummary}
								</Text>
							</div>
						) : null}
					</Card>

					{/* Video Performance */}
					<Card size="3" variant="surface" className="p-6">
						<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
							Video Performance
						</Heading>
						<div className="space-y-4">
							{performance.videos.map((video) => (
								<div key={video.videoId} className="p-4 border border-gray-a4 dark:border-gray-a6 rounded-lg">
									<div className="flex items-start gap-4">
										{video.thumbnail && (
											<img
												src={video.thumbnail}
												alt={video.title}
												className="w-32 h-20 object-cover rounded"
											/>
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-4 mb-2">
												<div className="flex-1 min-w-0">
													<Heading size="4" as="h3" className="mb-1 text-gray-12 dark:text-gray-12">
														{video.title}
													</Heading>
													<a
														href={`https://youtube.com/watch?v=${video.videoId}`}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-blue-10 hover:text-blue-11"
													>
														<Text size="2">View on YouTube</Text>
														<ExternalLinkIcon className="w-3 h-3" />
													</a>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
												<div>
													<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
														Views
													</Text>
													<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
														{formatCompact(video.views)}
													</Text>
												</div>
												<div>
													<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
														Watch Time
													</Text>
													<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
														{formatCompact(video.watchTime)} min
													</Text>
												</div>
												<div>
													<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
														CTR
													</Text>
													<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
														{video.ctr.toFixed(1)}%
													</Text>
												</div>
												<div>
													<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
														Engagement
													</Text>
													<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
														{video.engagement.toFixed(1)}%
													</Text>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</Card>
				</>
			) : (
				<Card size="3" variant="surface" className="p-6">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						No YouTube videos linked to this sponsor. Add video IDs in the sponsor settings to see performance metrics.
					</Text>
				</Card>
			)}
		</div>
	);
}

