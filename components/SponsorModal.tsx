"use client";

import { FormEvent, ReactNode, useState, useEffect } from "react";
import { Heading, Text, Card, Button, Dialog } from "@whop/react/components";
import { Cross2Icon } from "@radix-ui/react-icons";
import type { Sponsor, DealStatus, PaymentStatus } from "@/lib/sponsor-data";

const statusOptions: DealStatus[] = ["lead", "negotiating", "active", "completed", "rejected"];
const paymentStatusOptions: PaymentStatus[] = ["unpaid", "invoiced", "paid"];

interface SponsorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (sponsor: Omit<Sponsor, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">) => void;
	sponsor?: Sponsor | null;
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
	const [brandName, setBrandName] = useState("");
	const [contactName, setContactName] = useState("");
	const [contactEmail, setContactEmail] = useState("");
	const [dealValue, setDealValue] = useState("");
	const [deliverables, setDeliverables] = useState("");
	const [status, setStatus] = useState<DealStatus>("lead");
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
	const [dueDate, setDueDate] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (sponsor) {
			setBrandName(sponsor.brandName || "");
			setContactName(sponsor.contactName || "");
			setContactEmail(sponsor.contactEmail || "");
			setDealValue(sponsor.rate.toString());
			setDeliverables(sponsor.deliverables.join(", "));
			setStatus(sponsor.dealStatus);
			setPaymentStatus(sponsor.paymentStatus);
			setDueDate(sponsor.dueDate || "");
			setNotes(sponsor.notes || "");
		} else {
			// Reset form
			setBrandName("");
			setContactName("");
			setContactEmail("");
			setDealValue("");
			setDeliverables("");
			setStatus("lead");
			setPaymentStatus("unpaid");
			setDueDate("");
			setNotes("");
		}
		setError(null);
	}, [sponsor, isOpen]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const value = Number.parseFloat(dealValue.replace(/[^0-9.]/g, ""));
		if (!brandName || Number.isNaN(value) || value <= 0) {
			setError("Please provide a brand name and valid deal value.");
			return;
		}

		// Parse deliverables (comma-separated)
		const deliverablesArray = deliverables
			.split(",")
			.map((d) => d.trim())
			.filter((d) => d.length > 0);

		const sponsorData: Omit<Sponsor, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt"> = {
			brandName: brandName.trim(),
			contactName: contactName.trim() || undefined,
			contactEmail: contactEmail.trim() || undefined,
			dealStatus: status,
			platform: "youtube",
			deliverables: deliverablesArray,
			rate: value,
			currency: "USD", // Default to USD, can be made configurable later
			dueDate: dueDate || undefined,
			paymentStatus,
			notes: notes.trim() || undefined,
		};

		onSave(sponsorData);
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(open) => {
			if (!open) {
				onClose();
			}
		}}>
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
						<FormField label="Brand Name *">
							<input
								type="text"
								placeholder="Acme Co."
								value={brandName}
								onChange={(e) => setBrandName(e.target.value)}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
						<FormField label="Contact Name">
							<input
								type="text"
								placeholder="John Doe"
								value={contactName}
								onChange={(e) => setContactName(e.target.value)}
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
								step="100"
								placeholder="5000"
								value={dealValue}
								onChange={(e) => {
									const value = e.target.value;
									// Only allow whole numbers, round to nearest 100
									if (value === "") {
										setDealValue("");
									} else {
										const num = Math.round(Number.parseFloat(value) / 100) * 100;
										if (!Number.isNaN(num) && num >= 0) {
											setDealValue(num.toString());
										}
									}
								}}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
							<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
								Value increments in hundreds (e.g., 100, 200, 300...)
							</Text>
						</FormField>
						<FormField label="Status *">
							<select
								value={status}
								onChange={(e) => setStatus(e.target.value as DealStatus)}
								required
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							>
								{statusOptions.map((option) => (
									<option key={option} value={option}>
										{option.charAt(0).toUpperCase() + option.slice(1)}
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
										{option === "invoiced" ? "Invoiced" : option.charAt(0).toUpperCase() + option.slice(1)}
									</option>
								))}
							</select>
						</FormField>
						<FormField label="Due Date">
							<input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
							/>
						</FormField>
					</div>

					<FormField label="Deliverables">
						<input
							type="text"
							placeholder="1 video mention, 60s integration (comma-separated)"
							value={deliverables}
							onChange={(e) => setDeliverables(e.target.value)}
							className="w-full rounded-lg border border-gray-a4 dark:border-gray-a6 bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-8"
						/>
						<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
							Enter deliverables separated by commas
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

