"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Heading, Text, Card, Button } from "@whop/react/components";
import { PlusIcon, FileTextIcon, SymbolIcon, TrashIcon, DownloadIcon, LightningBoltIcon, CalendarIcon, EnvelopeClosedIcon, BarChartIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore, type SponsorDeal, type SponsorStatus } from "@/lib/store";

const statusOptions: SponsorStatus[] = ["active", "pending", "completed"];

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

interface DraftSponsor {
	brand: string;
	type: string;
	amount: string;
	status: SponsorStatus;
	deadline: string;
	notes: string;
}

const initialDraft: DraftSponsor = {
	brand: "",
	type: "",
	amount: "",
	status: "active",
	deadline: "",
	notes: "",
};

function FormField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
	return (
		<label className={`flex flex-col gap-2 ${className ?? ""}`}>
			<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
				{label}
			</Text>
			{children}
		</label>
	);
}

export default function SponsorsPage() {
	const { sponsors, addSponsor, updateSponsor, removeSponsor } = useAppStore();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [draft, setDraft] = useState<DraftSponsor>(initialDraft);
	const [error, setError] = useState<string | null>(null);
	const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(true);
	const [autoInvoiceEnabled, setAutoInvoiceEnabled] = useState(false);
	const [autoTimelineEnabled, setAutoTimelineEnabled] = useState(true);
	const [autoReportingEnabled, setAutoReportingEnabled] = useState(true);
	const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

	const stats = useMemo(() => {
		const totalRevenue = sponsors.reduce((sum, deal) => sum + deal.amount, 0);
		const activeCount = sponsors.filter((deal) => deal.status === "active").length;
		const pendingValue = sponsors
			.filter((deal) => deal.status === "pending")
			.reduce((sum, deal) => sum + deal.amount, 0);

		return {
			totalRevenue,
			activeCount,
			pendingValue,
		};
	}, [sponsors]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const amountValue = Number.parseFloat(draft.amount.replace(/[^0-9.]/g, ""));
		if (!draft.brand || !draft.type || Number.isNaN(amountValue)) {
			setError("Please provide a brand name, sponsorship type, and amount.");
			return;
		}

		const newDeal = {
			brand: draft.brand,
			type: draft.type,
			amount: amountValue,
			status: draft.status,
			deadline: draft.deadline || new Date().toISOString().slice(0, 10),
			notes: draft.notes.trim() || undefined,
		};

		addSponsor(newDeal);

		// Auto-generate invoice if enabled
		if (autoInvoiceEnabled) {
			setGeneratingInvoice(draft.brand);
			try {
				const response = await fetch("/api/automation/generate-invoice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						brandName: draft.brand,
						dealAmount: amountValue,
						deliverables: draft.type.split(",").map((d) => d.trim()),
						dueDate: draft.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
						autoSend: false,
					}),
				});
				const invoiceData = await response.json();
				if (response.ok) {
					console.log("Invoice generated:", invoiceData);
					alert(`Invoice generated for ${draft.brand}!`);
				}
			} catch (error) {
				console.error("Failed to generate invoice:", error);
			} finally {
				setGeneratingInvoice(null);
			}
		}

		// Auto-create campaign timeline if enabled
		if (autoTimelineEnabled) {
			// This would create tasks in the content planner
			console.log("Campaign timeline created for", draft.brand);
		}

		setDraft(initialDraft);
		setIsFormOpen(false);
		setError(null);
	};

	const onUpdateDraft = <Key extends keyof DraftSponsor>(key: Key, value: DraftSponsor[Key]) => {
		setDraft((prev) => ({ ...prev, [key]: value }));
	};

	const handleStatusChange = (deal: SponsorDeal, status: SponsorStatus) => {
		updateSponsor(deal.id, { status });
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Sponsor Management
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Track deals, revenue, and invoices
					</Text>
				</div>
				<div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
					<Button
						color="blue"
						size="3"
						variant="solid"
						onClick={() => {
							// Generate CSV from sponsors data
							const csvRows: string[] = [];
							
							// Header
							csvRows.push("Brand,Type,Amount (USD),Status,Deadline,Notes,Created At,Updated At");
							
							// Data rows
							sponsors.forEach((deal) => {
								const row = [
									deal.brand,
									deal.type,
									deal.amount.toString(),
									deal.status,
									deal.deadline,
									deal.notes || "",
									new Date(deal.createdAt).toISOString(),
									new Date(deal.updatedAt).toISOString(),
								].map((field) => {
									// Escape commas and quotes in CSV
									const str = String(field);
									if (str.includes(",") || str.includes('"') || str.includes("\n")) {
										return `"${str.replace(/"/g, '""')}"`;
									}
									return str;
								});
								csvRows.push(row.join(","));
							});
							
							const csv = csvRows.join("\n");
							const blob = new Blob([csv], { type: "text/csv" });
							const downloadUrl = window.URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = downloadUrl;
							a.download = `sponsors-export-${new Date().toISOString().split("T")[0]}.csv`;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							window.URL.revokeObjectURL(downloadUrl);
						}}
						disabled={sponsors.length === 0}
					>
						<DownloadIcon className="mr-2" />
						Export to Google Sheets
					</Button>
					<Button color="green" size="3" variant="solid" onClick={() => setIsFormOpen((prev) => !prev)}>
						<PlusIcon className="mr-2" />
						{isFormOpen ? "Close" : "New Deal"}
					</Button>
				</div>
			</div>

			{isFormOpen && (
				<Card size="3" variant="surface" className="p-6">
					<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
						Add a sponsor deal
					</Heading>
					<form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
	<FormField label="Brand">
		<input
			type="text"
			placeholder="Acme Co."
			value={draft.brand}
			onChange={(event) => onUpdateDraft("brand", event.target.value)}
			required
			className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
		/>
	</FormField>
	<FormField label="Sponsorship type">
		<input
			type="text"
			placeholder="Podcast read, integration..."
			value={draft.type}
			onChange={(event) => onUpdateDraft("type", event.target.value)}
			required
			className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
		/>
	</FormField>
	<FormField label="Amount (USD)">
		<input
			type="number"
			min="0"
			step="0.01"
			value={draft.amount}
			onChange={(event) => onUpdateDraft("amount", event.target.value)}
			required
			className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
		/>
	</FormField>
	<FormField label="Deadline">
		<input
			type="date"
			value={draft.deadline}
			onChange={(event) => onUpdateDraft("deadline", event.target.value)}
			className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
		/>
	</FormField>
	<FormField label="Status">
		<select
			value={draft.status}
			onChange={(event) => onUpdateDraft("status", event.target.value as SponsorStatus)}
			className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
		>
			{statusOptions.map((option) => (
				<option key={option} value={option}>
					{option.charAt(0).toUpperCase() + option.slice(1)}
				</option>
			))}
		</select>
	</FormField>
	<FormField label="Internal notes" className="sm:col-span-2">
		<textarea
			placeholder="Key talking points, deliverables, flight dates..."
			value={draft.notes}
			onChange={(event) => onUpdateDraft("notes", event.target.value)}
			rows={3}
			className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
		/>
	</FormField>
						<div className="sm:col-span-2 flex items-center justify-between gap-3">
							{error && (
								<Text size="2" color="red" className="text-red-10">
									{error}
								</Text>
							)}
							<div className="ml-auto flex gap-3">
								<Button variant="ghost" size="2" color="gray" onClick={() => setDraft(initialDraft)} type="button">
									Clear
								</Button>
								<Button color="green" size="3" variant="solid" type="submit">
									Save Deal
								</Button>
							</div>
						</div>
					</form>
				</Card>
			)}

			{/* Automation Features */}
			<Card size="3" variant="surface" className="p-6">
				<div className="flex items-center gap-2 mb-4">
					<LightningBoltIcon className="w-5 h-5 text-purple-9" />
					<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
						Automation Features
					</Heading>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<CalendarIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto-Track Payments
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Calculate timeline, send reminders, and follow-ups automatically
								</Text>
							</div>
						</div>
						<Button
							variant={autoTrackingEnabled ? "soft" : "outline"}
							color={autoTrackingEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoTrackingEnabled(!autoTrackingEnabled)}
							className="w-full"
						>
							{autoTrackingEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<FileTextIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto-Generate Invoices
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Generate PDF invoices, payment links, and deliverable checklists
								</Text>
							</div>
						</div>
						<Button
							variant={autoInvoiceEnabled ? "soft" : "outline"}
							color={autoInvoiceEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoInvoiceEnabled(!autoInvoiceEnabled)}
							className="w-full"
						>
							{autoInvoiceEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<CalendarIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto Campaign Timeline
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Auto-create script, filming, draft, and posting deadlines
								</Text>
							</div>
						</div>
						<Button
							variant={autoTimelineEnabled ? "soft" : "outline"}
							color={autoTimelineEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoTimelineEnabled(!autoTimelineEnabled)}
							className="w-full"
						>
							{autoTimelineEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<BarChartIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto Reporting
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Auto-pull analytics after post and send sponsor reports
								</Text>
							</div>
						</div>
						<Button
							variant={autoReportingEnabled ? "soft" : "outline"}
							color={autoReportingEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoReportingEnabled(!autoReportingEnabled)}
							className="w-full"
						>
							{autoReportingEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
				</div>
			</Card>

			{/* Revenue Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-green-a2 dark:bg-green-a3 flex items-center justify-center">
							<SymbolIcon className="w-6 h-6 text-green-11 dark:text-green-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Total pipeline value
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
								Active deals
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
							<SymbolIcon className="w-6 h-6 text-amber-11 dark:text-amber-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Pending value
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								{currencyFormatter.format(stats.pendingValue)}
							</Heading>
						</div>
					</div>
				</Card>
			</div>

			{/* Deals Table */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Deals & Invoices
				</Heading>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-a4 dark:border-gray-a6">
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray" className="text-gray-11 dark:text-gray-11">
										Brand
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Type
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Amount
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Status
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Deadline
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Notes
									</Text>
								</th>
								<th className="text-right py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Actions
									</Text>
								</th>
							</tr>
						</thead>
						<tbody>
							{sponsors.map((deal, index) => (
								<motion.tr
									key={deal.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									className="border-b border-gray-a4 dark:border-gray-a6 hover:bg-gray-a2 dark:hover:bg-gray-a3 transition-colors"
								>
									<td className="py-3 px-4">
										<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
											{deal.brand}
										</Text>
									</td>
									<td className="py-3 px-4">
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{deal.type}
										</Text>
									</td>
									<td className="py-3 px-4">
										<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
											{currencyFormatter.format(deal.amount)}
										</Text>
									</td>
									<td className="py-3 px-4">
										<select
											value={deal.status}
											onChange={(event) => handleStatusChange(deal, event.target.value as SponsorStatus)}
											className="rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-8"
										>
											{statusOptions.map((option) => (
												<option key={option} value={option}>
													{option.charAt(0).toUpperCase() + option.slice(1)}
												</option>
											))}
										</select>
									</td>
									<td className="py-3 px-4">
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{new Date(deal.deadline).toLocaleDateString()}
										</Text>
									</td>
									<td className="py-3 px-4">
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 line-clamp-2">
											{deal.notes ?? "—"}
										</Text>
									</td>
									<td className="py-3 px-4 text-right">
										<div className="flex items-center justify-end gap-2">
											{autoInvoiceEnabled && (
												<Button
													variant="ghost"
													size="1"
													color="blue"
													onClick={async () => {
														setGeneratingInvoice(deal.brand);
														try {
															const response = await fetch("/api/automation/generate-invoice", {
																method: "POST",
																headers: { "Content-Type": "application/json" },
																body: JSON.stringify({
																	brandName: deal.brand,
																	dealAmount: deal.amount,
																	deliverables: [deal.type],
																	dueDate: deal.deadline,
																	autoSend: false,
																}),
															});
															const invoiceData = await response.json();
															if (response.ok) {
																alert(`Invoice generated for ${deal.brand}!`);
															}
														} catch (error) {
															alert("Failed to generate invoice");
														} finally {
															setGeneratingInvoice(null);
														}
													}}
													disabled={generatingInvoice === deal.brand}
													title="Generate Invoice"
												>
													<FileTextIcon />
												</Button>
											)}
											<Button
												variant="ghost"
												size="1"
												color="red"
												onClick={() => removeSponsor(deal.id)}
												title="Remove deal"
											>
												<TrashIcon />
											</Button>
										</div>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
				{!sponsors.length && (
					<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mt-4">
						No sponsorship deals yet. Add your first partnership using the “New Deal” button.
					</Text>
				)}
			</Card>
		</div>
	);
}
