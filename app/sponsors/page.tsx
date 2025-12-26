"use client";

import { useMemo, useState, useEffect } from "react";
import { Heading, Text, Card, Button, Badge, Dialog, Separator } from "@whop/react/components";
import { PlusIcon, FileTextIcon, ExternalLinkIcon, ArrowRightIcon, DownloadIcon, FileIcon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { SponsorModal } from "@/components/SponsorModal";
import { useAppStore } from "@/lib/store";
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
	const { user } = useAppStore();
	const [sponsors, setSponsors] = useState<Sponsor[]>([]);
	const [loading, setLoading] = useState(true);
	const [summary, setSummary] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
	const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

	// Sync user data and fetch sponsors on mount
	useEffect(() => {
		const syncAndFetch = async () => {
			// First, check if user is authenticated
			try {
				const authResponse = await fetch("/api/auth/me", {
					credentials: "include",
				});
				
				if (authResponse.ok) {
					const authData = await authResponse.json();
					if (!authData.success || !authData.user) {
						console.warn("User not authenticated");
						setLoading(false);
						return;
					}
				} else {
					console.warn("Authentication check failed");
					setLoading(false);
					return;
				}
			} catch (error) {
				console.error("Failed to check authentication:", error);
				setLoading(false);
				return;
			}

			// Fetch sponsors
			try {
				const response = await fetch("/api/sponsors", {
					credentials: "include",
				});

				if (response.ok) {
					const data = await response.json();
					setSponsors(data.sponsors || []);
					setSummary(data.summary || null);
				} else if (response.status === 401) {
					console.warn("Unauthorized - user needs to log in");
				}
			} catch (error) {
				console.error("Failed to fetch sponsors:", error);
			} finally {
				setLoading(false);
			}
		};

		syncAndFetch();
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

	const handleExportToGoogleSheets = async () => {
		try {
			// Convert sponsors to CSV format
			const headers = ["Brand Name", "Contact Name", "Contact Email", "Deal Value", "Currency", "Status", "Payment Status", "Deliverables", "Due Date", "Notes"];
			const rows = sponsors.map((sponsor) => [
				sponsor.brandName || "",
				sponsor.contactName || "",
				sponsor.contactEmail || "",
				sponsor.rate.toString(),
				sponsor.currency || "USD",
				sponsor.dealStatus,
				sponsor.paymentStatus,
				sponsor.deliverables?.join("; ") || "",
				sponsor.dueDate || "",
				sponsor.notes || "",
			]);

			// Add BOM for Excel compatibility
			const BOM = "\uFEFF";
			const csvContent = BOM + [
				headers.join(","),
				...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
			].join("\n");

			// Create blob with proper MIME type
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			
			// Try to open in new tab first, then download if that fails
			const newWindow = window.open(url, '_blank');
			if (!newWindow) {
				// If popup blocked, download instead
				const link = document.createElement("a");
				link.setAttribute("href", url);
				link.setAttribute("download", `sponsors-export-${new Date().toISOString().split("T")[0]}.csv`);
				link.style.visibility = "hidden";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
			
			// Don't revoke URL immediately if opened in new tab
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			
			alert("Sponsors exported successfully! The file should open in a new tab. You can import this CSV file into Google Sheets.");
		} catch (error) {
			console.error("Failed to export to Google Sheets:", error);
			alert("Failed to export sponsors. Please try again.");
		}
	};

	const handleGenerateInvoice = async (sponsor: Sponsor) => {
		try {
			console.log("[Invoice] Generating invoice for sponsor:", sponsor.id, sponsor.brandName);
			const response = await fetch(`/api/sponsors/${sponsor.id}/export`, {
				credentials: "include",
				method: "GET",
			});

			if (response.ok) {
				// Check if response is PDF
				const contentType = response.headers.get("content-type");
				if (contentType && contentType.includes("application/pdf")) {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					
					// Create download link
					const a = document.createElement("a");
					a.href = url;
					a.download = `invoice-${sponsor.brandName.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split("T")[0]}.pdf`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					
					// Clean up URL after a delay
					setTimeout(() => URL.revokeObjectURL(url), 1000);
				} else {
					// If not PDF, try to parse as JSON error
					const errorData = await response.json().catch(() => ({}));
					alert(errorData.error || "Failed to generate invoice. Invalid response format.");
				}
			} else {
				// Handle error response
				const contentType = response.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					const errorData = await response.json().catch(() => ({}));
					alert(errorData.error || "Failed to generate invoice. Please try again.");
				} else {
					alert("Failed to generate invoice. Please try again.");
				}
			}
		} catch (error) {
			console.error("Failed to generate invoice:", error);
			alert("An error occurred while generating the invoice. Please try again.");
		}
	};

	const handleSaveSponsor = async (sponsorData: Omit<Sponsor, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">) => {
		// Check if user is logged in
		if (!user) {
			alert("Please log in to add sponsors. Redirecting to login page...");
			window.location.href = "/login";
			return;
		}

		try {
			let response: Response;
			
			if (editingSponsor) {
				// Update existing sponsor
				response = await fetch(`/api/sponsors/${editingSponsor.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(sponsorData),
				});
			} else {
				// Create new sponsor
				response = await fetch("/api/sponsors", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(sponsorData),
				});
			}

			const responseData = await response.json();

			if (!response.ok) {
				// Show error message
				let errorMessage = responseData.error || responseData.errors?.join(", ") || "Failed to save sponsor";
				
				// Provide more helpful error messages
				if (response.status === 401) {
					errorMessage = "You are not logged in. Please log in and try again.";
				} else if (response.status === 400) {
					errorMessage = `Validation error: ${errorMessage}`;
				}
				
				alert(errorMessage);
				console.error("Failed to save sponsor:", responseData);
				return;
			}

			// Refresh sponsors list
			const refreshResponse = await fetch("/api/sponsors", {
				credentials: "include",
			});
			
			if (refreshResponse.ok) {
				const data = await refreshResponse.json();
				setSponsors(data.sponsors || []);
				setSummary(data.summary || null);
			}

			// Close modal only on success
			setIsModalOpen(false);
			setEditingSponsor(null);
		} catch (error) {
			console.error("Failed to save sponsor:", error);
			alert("An error occurred while saving the sponsor. Please try again.");
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

			{/* Action Cards */}
			{sponsors.length > 0 && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Card size="3" variant="surface" className="p-6 hover:border-blue-6 transition-colors cursor-pointer" onClick={handleExportToGoogleSheets}>
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-lg bg-green-a2 dark:bg-green-a3 flex items-center justify-center flex-shrink-0">
								<DownloadIcon className="w-6 h-6 text-green-11 dark:text-green-10" />
							</div>
							<div className="flex-1 min-w-0">
								<Heading size="4" as="h3" className="mb-1 text-gray-12 dark:text-gray-12">
									Export to Google Sheets
								</Heading>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Download all sponsors as CSV for Google Sheets
								</Text>
							</div>
						</div>
					</Card>
					<Card 
						size="3" 
						variant="surface" 
						className={`p-6 transition-colors ${sponsors.length > 0 ? 'hover:border-blue-6 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
						onClick={() => {
							if (sponsors.length > 0) {
								setIsInvoiceModalOpen(true);
							} else {
								alert("Please add a sponsor first before generating an invoice.");
							}
						}}
					>
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center flex-shrink-0">
								<FileIcon className="w-6 h-6 text-blue-11 dark:text-blue-10" />
							</div>
							<div className="flex-1 min-w-0">
								<Heading size="4" as="h3" className="mb-1 text-gray-12 dark:text-gray-12">
									Generate Invoice
								</Heading>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									{sponsors.length > 0 ? "Select a sponsor to generate invoice" : "Add a sponsor first"}
								</Text>
							</div>
						</div>
					</Card>
				</div>
			)}

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
												{sponsor.brandName}
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

								<div className="flex flex-col gap-2 pt-4 border-t border-gray-a4 dark:border-gray-a6">
									<div className="flex gap-2">
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
											<Button 
												variant="solid" 
												size="2" 
												color="blue" 
												className="w-full flex items-center justify-center gap-1.5"
											>
												<span className="truncate">View Details</span>
												<ArrowRightIcon className="w-4 h-4 flex-shrink-0" />
											</Button>
										</Link>
									</div>
									<div className="flex gap-2">
										{sponsor.paymentStatus === "unpaid" && (
											<Button
												variant="ghost"
												size="2"
												color="green"
												className="flex-1"
												onClick={() => handleGenerateInvoice(sponsor)}
											>
												<FileIcon className="mr-2" />
												Generate Invoice
											</Button>
										)}
										<Button
											variant="ghost"
											size="2"
											color="red"
											className="flex-1"
											onClick={async () => {
												if (confirm(`Are you sure you want to delete ${sponsor.brandName}? This action cannot be undone.`)) {
													try {
														const response = await fetch(`/api/sponsors/${sponsor.id}`, {
															method: "DELETE",
															credentials: "include",
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
														} else {
															const errorData = await response.json().catch(() => ({}));
															alert(errorData.error || "Failed to delete sponsor");
														}
													} catch (error) {
														console.error("Failed to delete sponsor:", error);
														alert("An error occurred while deleting the sponsor. Please try again.");
													}
												}
											}}
										>
											<TrashIcon className="mr-2" />
											Delete
										</Button>
									</div>
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

			{/* Invoice Generation Modal */}
			<Dialog.Root open={isInvoiceModalOpen} onOpenChange={(open) => setIsInvoiceModalOpen(open)}>
				<Dialog.Content className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<div className="flex items-center justify-between mb-6">
						<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
							Generate Invoice
						</Heading>
						<Button
							variant="ghost"
							size="2"
							onClick={() => setIsInvoiceModalOpen(false)}
						>
							<Cross2Icon className="w-4 h-4" />
						</Button>
					</div>

					<Text size="2" color="gray" className="mb-6 text-gray-11 dark:text-gray-11">
						Select a sponsor to generate an invoice for:
					</Text>

					{sponsors.length === 0 ? (
						<Card size="2" variant="surface" className="p-8 text-center">
							<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 mb-4">
								No sponsors available. Please add a sponsor first.
							</Text>
							<Button color="green" size="3" variant="solid" onClick={() => {
								setIsInvoiceModalOpen(false);
								handleAddSponsor();
							}}>
								<PlusIcon className="mr-2" />
								Add Sponsor
							</Button>
						</Card>
					) : (
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{sponsors.map((sponsor) => (
								<Card
									key={sponsor.id}
									size="2"
									variant="surface"
									className="p-4 hover:border-blue-6 transition-colors cursor-pointer"
									onClick={() => {
										setIsInvoiceModalOpen(false);
										handleGenerateInvoice(sponsor);
									}}
								>
									<div className="flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<Heading size="4" as="h3" className="mb-2 text-gray-12 dark:text-gray-12 truncate">
												{sponsor.brandName}
											</Heading>
											<div className="flex items-center gap-2 mb-2">
												<Badge color={statusColors[sponsor.dealStatus]} variant="soft" size="1">
													{sponsor.dealStatus.charAt(0).toUpperCase() + sponsor.dealStatus.slice(1)}
												</Badge>
												<Badge color={paymentStatusColors[sponsor.paymentStatus]} variant="soft" size="1">
													{sponsor.paymentStatus === "invoiced" ? "Invoiced" : sponsor.paymentStatus === "unpaid" ? "Unpaid" : "Paid"}
												</Badge>
											</div>
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												{currencyFormatter.format(sponsor.rate)} {sponsor.currency}
											</Text>
										</div>
										<FileIcon className="w-5 h-5 text-blue-11 dark:text-blue-10 flex-shrink-0 ml-4" />
									</div>
								</Card>
							))}
						</div>
					)}
				</Dialog.Content>
			</Dialog.Root>
		</div>
	);
}
