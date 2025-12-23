"use client";

import { useMemo, useState } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { PlusIcon, FileTextIcon, ExternalLinkIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore, type SponsorDeal, type SponsorStatus, type PaymentStatus } from "@/lib/store";
import { BackButton } from "@/components/BackButton";
import { SponsorModal } from "@/components/SponsorModal";

const statusOptions: SponsorStatus[] = ["lead", "negotiating", "active", "completed"];
const paymentStatusOptions: PaymentStatus[] = ["unpaid", "partially_paid", "paid"];

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const statusColors: Record<SponsorStatus, "blue" | "amber" | "green" | "gray"> = {
	lead: "blue",
	negotiating: "amber",
	active: "green",
	completed: "gray",
};

const paymentStatusColors: Record<PaymentStatus, "red" | "amber" | "green"> = {
	unpaid: "red",
	partially_paid: "amber",
	paid: "green",
};

export default function SponsorsPage() {
	const { sponsors, addSponsor, updateSponsor, removeSponsor } = useAppStore();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSponsor, setEditingSponsor] = useState<SponsorDeal | null>(null);

	const stats = useMemo(() => {
		const totalRevenue = sponsors.reduce((sum, deal) => sum + (deal.dealValue || deal.amount || 0), 0);
		const activeCount = sponsors.filter((deal) => deal.status === "active").length;
		const pendingValue = sponsors
			.filter((deal) => deal.status === "negotiating" || deal.status === "lead")
			.reduce((sum, deal) => sum + (deal.dealValue || deal.amount || 0), 0);
		const unpaidValue = sponsors
			.filter((deal) => deal.paymentStatus === "unpaid" || deal.paymentStatus === "partially_paid")
			.reduce((sum, deal) => sum + (deal.dealValue || deal.amount || 0), 0);

		return {
			totalRevenue,
			activeCount,
			pendingValue,
			unpaidValue,
		};
	}, [sponsors]);

	const handleAddSponsor = () => {
		setEditingSponsor(null);
		setIsModalOpen(true);
	};

	const handleEditSponsor = (sponsor: SponsorDeal) => {
		setEditingSponsor(sponsor);
		setIsModalOpen(true);
	};

	const handleSaveSponsor = (sponsorData: Omit<SponsorDeal, "id" | "createdAt" | "updatedAt">) => {
		if (editingSponsor) {
			updateSponsor(editingSponsor.id, sponsorData);
		} else {
			addSponsor(sponsorData);
		}
		setIsModalOpen(false);
		setEditingSponsor(null);
	};

	// Helper to get sponsor name (backward compatibility)
	const getSponsorName = (deal: SponsorDeal) => deal.name || deal.brand || "Unknown Sponsor";
	const getDealValue = (deal: SponsorDeal) => deal.dealValue || deal.amount || 0;

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Sponsor Management
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Track brand deals, performance, and payments. Performance data is pulled automatically from YouTube.
					</Text>
				</div>
				<Button color="green" size="3" variant="solid" onClick={handleAddSponsor}>
					<PlusIcon className="mr-2" />
					Add Sponsor
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-green-a2 dark:bg-green-a3 flex items-center justify-center">
							<FileTextIcon className="w-6 h-6 text-green-11 dark:text-green-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Total Pipeline Value
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								{currencyFormatter.format(stats.totalRevenue)}
							</Heading>
						</div>
					</div>
				</Card>
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center">
							<FileTextIcon className="w-6 h-6 text-blue-11 dark:text-blue-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Active Deals
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								{stats.activeCount}
							</Heading>
						</div>
					</div>
				</Card>
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-amber-a2 dark:bg-amber-a3 flex items-center justify-center">
							<FileTextIcon className="w-6 h-6 text-amber-11 dark:text-amber-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Pending Value
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								{currencyFormatter.format(stats.pendingValue)}
							</Heading>
						</div>
					</div>
				</Card>
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-red-a2 dark:bg-red-a3 flex items-center justify-center">
							<FileTextIcon className="w-6 h-6 text-red-11 dark:text-red-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Unpaid Value
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								{currencyFormatter.format(stats.unpaidValue)}
							</Heading>
						</div>
					</div>
				</Card>
			</div>

			{/* Sponsors Grid */}
			{sponsors.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{sponsors.map((sponsor, index) => (
						<motion.div
							key={sponsor.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
						>
							<Card size="3" variant="surface" className="p-6 h-full flex flex-col hover:border-blue-6 transition-colors">
								<div className="flex-1">
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1 min-w-0">
											<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12 truncate">
												{getSponsorName(sponsor)}
											</Heading>
											<div className="flex flex-wrap gap-2 mb-3">
												<Badge color={statusColors[sponsor.status]} variant="soft" size="1">
													{sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
												</Badge>
												<Badge color={paymentStatusColors[sponsor.paymentStatus || "unpaid"]} variant="soft" size="1">
													{sponsor.paymentStatus === "partially_paid" ? "Partially Paid" : sponsor.paymentStatus === "unpaid" ? "Unpaid" : "Paid"}
												</Badge>
											</div>
										</div>
									</div>

									<div className="space-y-2 mb-4">
										<div className="flex items-center justify-between">
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												Deal Value
											</Text>
											<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
												{currencyFormatter.format(getDealValue(sponsor))}
											</Text>
										</div>
										{sponsor.deliverables && (
											<div>
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mb-1">
													Deliverables
												</Text>
												<Text size="2" className="text-gray-12 dark:text-gray-12">
													{sponsor.deliverables}
												</Text>
											</div>
										)}
										{sponsor.youtubeVideoIds && sponsor.youtubeVideoIds.length > 0 && (
											<div>
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mb-1">
													Videos
												</Text>
												<Text size="2" className="text-gray-12 dark:text-gray-12">
													{sponsor.youtubeVideoIds.length} video{sponsor.youtubeVideoIds.length !== 1 ? "s" : ""} linked
												</Text>
											</div>
										)}
										<div className="flex items-center justify-between">
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												Platform
											</Text>
											<Badge color="red" variant="soft" size="1">
												YouTube
											</Badge>
										</div>
										{sponsor.endDate && (
											<div className="flex items-center justify-between">
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
													End Date
												</Text>
												<Text size="2" className="text-gray-12 dark:text-gray-12">
													{new Date(sponsor.endDate).toLocaleDateString()}
												</Text>
											</div>
										)}
									</div>
								</div>

								<div className="flex gap-2 pt-4 border-t border-gray-a4 dark:border-gray-a6">
									<Button
										variant="ghost"
										size="2"
										color="blue"
										className="flex-1"
										onClick={() => handleEditSponsor(sponsor)}
									>
										Edit
									</Button>
									<Link href={`/sponsors/${sponsor.id}`} className="flex-1">
										<Button variant="solid" size="2" color="blue" className="w-full">
											View Details
											<ArrowRightIcon className="ml-2" />
										</Button>
									</Link>
								</div>
							</Card>
						</motion.div>
					))}
				</div>
			) : (
				<Card size="3" variant="surface" className="p-12 text-center">
					<FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-9 dark:text-gray-10" />
					<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
						No sponsors yet
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 mb-6">
						Add your first brand deal to start tracking sponsorships and performance.
					</Text>
					<Button color="green" size="3" variant="solid" onClick={handleAddSponsor}>
						<PlusIcon className="mr-2" />
						Add Sponsor
					</Button>
				</Card>
			)}

			{/* Sponsor Modal */}
			<SponsorModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingSponsor(null);
				}}
				onSave={handleSaveSponsor}
				sponsor={editingSponsor}
			/>
		</div>
	);
}
