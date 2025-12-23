"use client";

import { useMemo, useState, useEffect } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { PlusIcon, FileTextIcon, ExternalLinkIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { SponsorModal } from "@/components/SponsorModal";
import type { Sponsor, DealStatus, PaymentStatus } from "@/lib/sponsor-data";

const statusOptions: DealStatus[] = ["lead", "negotiating", "active", "completed", "rejected"];
const paymentStatusOptions: PaymentStatus[] = ["unpaid", "invoiced", "paid"];

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const statusColors: Record<DealStatus, "blue" | "amber" | "green" | "gray" | "red"> = {
	lead: "blue",
	negotiating: "amber",
	active: "green",
	completed: "gray",
	rejected: "red",
};

const paymentStatusColors: Record<PaymentStatus, "red" | "amber" | "green"> = {
	unpaid: "red",
	invoiced: "amber",
	paid: "green",
};

export default function SponsorsPage() {
	const [sponsors, setSponsors] = useState<Sponsor[]>([]);
	const [loading, setLoading] = useState(true);
	const [summary, setSummary] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

	// Fetch sponsors from API
	useEffect(() => {
		const fetchSponsors = async () => {
			try {
				const response = await fetch("/api/sponsors", {
					credentials: "include",
				});

				if (response.ok) {
					const data = await response.json();
					setSponsors(data.sponsors || []);
					setSummary(data.summary || null);
				}
			} catch (error) {
				console.error("Failed to fetch sponsors:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSponsors();
	}, []);

	const stats = useMemo(() => {
		if (!summary) {
			return {
				totalRevenue: 0,
				activeCount: 0,
				pendingValue: 0,
				unpaidValue: 0,
			};
		}

		return {
			totalRevenue: summary.totalDealValue || 0,
			activeCount: summary.activeDealsCount || 0,
			pendingValue: summary.totalDealValue || 0, // Total pipeline value
			unpaidValue: summary.unpaidAmount || 0,
		};
	}, [summary]);

	const handleAddSponsor = () => {
		setEditingSponsor(null);
		setIsModalOpen(true);
	};

	const handleEditSponsor = (sponsor: Sponsor) => {
		setEditingSponsor(sponsor);
		setIsModalOpen(true);
	};

	const handleSaveSponsor = async (sponsorData: Omit<Sponsor, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">) => {
		try {
			if (editingSponsor) {
				// Update existing sponsor
				const response = await fetch(`/api/sponsors/${editingSponsor.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(sponsorData),
				});

				if (response.ok) {
					// Refresh sponsors list
					const refreshResponse = await fetch("/api/sponsors", {
						credentials: "include",
					});
					if (refreshResponse.ok) {
						const data = await refreshResponse.json();
						setSponsors(data.sponsors || []);
						setSummary(data.summary || null);
					}
				}
			} else {
				// Create new sponsor
				const response = await fetch("/api/sponsors", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(sponsorData),
				});

				if (response.ok) {
					// Refresh sponsors list
					const refreshResponse = await fetch("/api/sponsors", {
						credentials: "include",
					});
					if (refreshResponse.ok) {
						const data = await refreshResponse.json();
						setSponsors(data.sponsors || []);
						setSummary(data.summary || null);
					}
				}
			}
		} catch (error) {
			console.error("Failed to save sponsor:", error);
		} finally {
			setIsModalOpen(false);
			setEditingSponsor(null);
		}
	};

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
			{loading ? (
				<Card size="3" variant="surface" className="p-12 text-center">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						Loading sponsors...
					</Text>
				</Card>
			) : sponsors.length > 0 ? (
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
											<Badge color={statusColors[sponsor.dealStatus]} variant="soft" size="1">
												{sponsor.dealStatus.charAt(0).toUpperCase() + sponsor.dealStatus.slice(1)}
											</Badge>
											<Badge color={paymentStatusColors[sponsor.paymentStatus]} variant="soft" size="1">
												{sponsor.paymentStatus === "invoiced" ? "Invoiced" : sponsor.paymentStatus === "unpaid" ? "Unpaid" : "Paid"}
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
												{currencyFormatter.format(sponsor.rate)} {sponsor.currency}
											</Text>
										</div>
										{sponsor.deliverables && sponsor.deliverables.length > 0 && (
											<div>
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mb-1">
													Deliverables
												</Text>
												<Text size="2" className="text-gray-12 dark:text-gray-12">
													{sponsor.deliverables.join(", ")}
												</Text>
											</div>
										)}
										<div className="flex items-center justify-between">
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												Platform
											</Text>
											<Badge color="red" variant="soft" size="1">
												{sponsor.platform.charAt(0).toUpperCase() + sponsor.platform.slice(1)}
											</Badge>
										</div>
										{sponsor.dueDate && (
											<div className="flex items-center justify-between">
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
													Due Date
												</Text>
												<Text size="2" className="text-gray-12 dark:text-gray-12">
													{new Date(sponsor.dueDate).toLocaleDateString()}
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
