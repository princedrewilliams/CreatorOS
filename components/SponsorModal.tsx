"use client";

import { FormEvent, ReactNode, useState, useEffect } from "react";
import { Heading, Text, Card, Button, Dialog } from "@whop/react/components";
import { Cross2Icon } from "@radix-ui/react-icons";
import type { SponsorDeal, SponsorStatus, PaymentStatus } from "@/lib/store";

const statusOptions: SponsorStatus[] = ["lead", "negotiating", "active", "completed"];
const paymentStatusOptions: PaymentStatus[] = ["unpaid", "partially_paid", "paid"];

interface SponsorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (sponsor: Omit<SponsorDeal, "id" | "createdAt" | "updatedAt">) => void;
	sponsor?: SponsorDeal | null;
}

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

export function SponsorModal({ isOpen, onClose, onSave, sponsor }: SponsorModalProps) {
	const [name, setName] = useState("");
	const [contactEmail, setContactEmail] = useState("");
	const [dealValue, setDealValue] = useState("");
	const [deliverables, setDeliverables] = useState("");
	const [youtubeVideoIds, setYoutubeVideoIds] = useState("");
	const [status, setStatus] = useState<SponsorStatus>("lead");
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (sponsor) {
			setName(sponsor.name || sponsor.brand || "");
			setContactEmail(sponsor.contactEmail || "");
			setDealValue((sponsor.dealValue || sponsor.amount || 0).toString());
			setDeliverables(sponsor.deliverables || "");
			setYoutubeVideoIds((sponsor.youtubeVideoIds || []).join(", "));
			setStatus(sponsor.status);
			setPaymentStatus(sponsor.paymentStatus || "unpaid");
			setStartDate(sponsor.startDate || "");
			setEndDate(sponsor.endDate || sponsor.deadline || "");
			setNotes(sponsor.notes || "");
		} else {
			// Reset form
			setName("");
			setContactEmail("");
			setDealValue("");
			setDeliverables("");
			setYoutubeVideoIds("");
			setStatus("lead");
			setPaymentStatus("unpaid");
			setStartDate("");
			setEndDate("");
			setNotes("");
		}
		setError(null);
	}, [sponsor, isOpen]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const value = Number.parseFloat(dealValue.replace(/[^0-9.]/g, ""));
		if (!name || Number.isNaN(value) || value <= 0) {
			setError("Please provide a sponsor name and valid deal value.");
			return;
		}

		// Parse YouTube video IDs (comma-separated, extract IDs from URLs if needed)
		const videoIds = youtubeVideoIds
			.split(",")
			.map((id) => {
				const trimmed = id.trim();
				// Extract video ID from YouTube URL if provided
				const urlMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
				return urlMatch ? urlMatch[1] : trimmed;
			})
			.filter((id) => id.length > 0);

		const sponsorData: Omit<SponsorDeal, "id" | "createdAt" | "updatedAt"> = {
			name,
			contactEmail: contactEmail.trim() || undefined,
			dealValue: value,
			deliverables: deliverables.trim() || "",
			youtubeVideoIds: videoIds,
			status,
			paymentStatus,
			startDate: startDate || new Date().toISOString().split("T")[0],
			endDate: endDate || new Date().toISOString().split("T")[0],
			notes: notes.trim() || undefined,
		};

		onSave(sponsorData);
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Dialog.Content className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-6">
					<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
						{sponsor ? "Edit Sponsor" : "Add Sponsor"}
					</Heading>
					<Button variant="ghost" size="1" onClick={onClose}>
						<Cross2Icon />
					</Button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField label="Sponsor Name *">
							<input
								type="text"
								placeholder="Acme Co."
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
						<FormField label="Contact Email">
							<input
								type="email"
								placeholder="contact@acme.com"
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
						<FormField label="Deal Value (USD) *">
							<input
								type="number"
								min="0"
								step="0.01"
								placeholder="5000"
								value={dealValue}
								onChange={(e) => setDealValue(e.target.value)}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
						<FormField label="Status *">
							<select
								value={status}
								onChange={(e) => setStatus(e.target.value as SponsorStatus)}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							>
								{statusOptions.map((option) => (
									<option key={option} value={option}>
										{option.charAt(0).toUpperCase() + option.slice(1).replace("_", " ")}
									</option>
								))}
							</select>
						</FormField>
						<FormField label="Payment Status *">
							<select
								value={paymentStatus}
								onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							>
								{paymentStatusOptions.map((option) => (
									<option key={option} value={option}>
										{option === "partially_paid" ? "Partially Paid" : option.charAt(0).toUpperCase() + option.slice(1)}
									</option>
								))}
							</select>
						</FormField>
						<FormField label="Start Date">
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
						<FormField label="End Date">
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
					</div>

					<FormField label="Deliverables">
						<input
							type="text"
							placeholder="1 video mention, 60s integration"
							value={deliverables}
							onChange={(e) => setDeliverables(e.target.value)}
							className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
						/>
					</FormField>

					<FormField label="YouTube Video IDs or URLs">
						<input
							type="text"
							placeholder="dQw4w9WgXcQ or https://youtube.com/watch?v=dQw4w9WgXcQ (comma-separated)"
							value={youtubeVideoIds}
							onChange={(e) => setYoutubeVideoIds(e.target.value)}
							className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
						/>
						<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
							Performance data will be pulled automatically from YouTube Analytics
						</Text>
					</FormField>

					<FormField label="Notes">
						<textarea
							placeholder="Key talking points, deliverables, flight dates..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
						/>
					</FormField>

					{error && (
						<Text size="2" color="red" className="text-red-10">
							{error}
						</Text>
					)}

					<div className="flex items-center justify-end gap-3 pt-4">
						<Button variant="ghost" size="2" color="gray" onClick={onClose} type="button">
							Cancel
						</Button>
						<Button color="green" size="3" variant="solid" type="submit">
							{sponsor ? "Update Sponsor" : "Add Sponsor"}
						</Button>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

