"use client";

import { useState, FormEvent } from "react";
import { Heading, Text, Card, Button } from "@whop/react/components";
import { Cross2Icon, FileTextIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onGenerate: (data: InvoiceFormData) => Promise<void>;
	initialData?: {
		brandName?: string;
		dealAmount?: number;
		deliverables?: string[];
		deadline?: string;
	};
}

export interface InvoiceFormData {
	companyName: string;
	amount: number;
	dueDate: string;
	deliverables: string[];
	description?: string;
}

export function InvoiceModal({ isOpen, onClose, onGenerate, initialData }: InvoiceModalProps) {
	const [formData, setFormData] = useState<InvoiceFormData>({
		companyName: initialData?.brandName || "",
		amount: initialData?.dealAmount || 0,
		dueDate: initialData?.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
		deliverables: initialData?.deliverables || [],
		description: "",
	});
	const [deliverableInput, setDeliverableInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!formData.companyName || !formData.amount || !formData.dueDate) {
			setError("Please fill in all required fields");
			return;
		}

		if (formData.amount <= 0) {
			setError("Amount must be greater than 0");
			return;
		}

		setLoading(true);
		try {
			await onGenerate(formData);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate invoice");
		} finally {
			setLoading(false);
		}
	};

	const addDeliverable = () => {
		if (deliverableInput.trim()) {
			setFormData((prev) => ({
				...prev,
				deliverables: [...prev.deliverables, deliverableInput.trim()],
			}));
			setDeliverableInput("");
		}
	};

	const removeDeliverable = (index: number) => {
		setFormData((prev) => ({
			...prev,
			deliverables: prev.deliverables.filter((_, i) => i !== index),
		}));
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md"
						onClick={onClose}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
						onClick={(e) => e.stopPropagation()}
					>
						<Card size="3" variant="surface" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-2">
									<FileTextIcon className="w-5 h-5 text-blue-11" />
									<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
										Generate Invoice
									</Heading>
								</div>
								<Button variant="ghost" size="1" onClick={onClose}>
									<Cross2Icon className="w-4 h-4" />
								</Button>
							</div>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Company Name <span className="text-red-11">*</span>
									</Text>
									<input
										type="text"
										value={formData.companyName}
										onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
										required
										placeholder="Acme Corporation"
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
									/>
								</div>

								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Amount (USD) <span className="text-red-11">*</span>
									</Text>
									<input
										type="number"
										min="0"
										step="0.01"
										value={formData.amount || ""}
										onChange={(e) => setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
										required
										placeholder="5000.00"
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
									/>
								</div>

								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Due Date <span className="text-red-11">*</span>
									</Text>
									<input
										type="date"
										value={formData.dueDate}
										onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
										required
										min={new Date().toISOString().split("T")[0]}
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
									/>
								</div>

								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Description (Optional)
									</Text>
									<textarea
										value={formData.description || ""}
										onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
										placeholder="Invoice description or notes..."
										rows={3}
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
									/>
								</div>

								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Deliverables Checklist
									</Text>
									<div className="flex gap-2 mb-2">
										<input
											type="text"
											value={deliverableInput}
											onChange={(e) => setDeliverableInput(e.target.value)}
											onKeyPress={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addDeliverable();
												}
											}}
											placeholder="Add deliverable item..."
											className="flex-1 px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
										/>
										<Button type="button" variant="soft" size="2" onClick={addDeliverable}>
											Add
										</Button>
									</div>
									{formData.deliverables.length > 0 && (
										<div className="space-y-2">
											{formData.deliverables.map((item, index) => (
												<div key={index} className="flex items-center gap-2 p-2 bg-gray-a2 dark:bg-gray-a3 rounded-md">
													<input
														type="checkbox"
														className="w-4 h-4"
														readOnly
														checked={false}
													/>
													<Text size="2" className="flex-1 text-gray-11 dark:text-gray-11">
														{item}
													</Text>
													<Button
														type="button"
														variant="ghost"
														size="1"
														onClick={() => removeDeliverable(index)}
													>
														<Cross2Icon className="w-3 h-3" />
													</Button>
												</div>
											))}
										</div>
									)}
								</div>

								{error && (
									<Card size="1" variant="surface" className="p-3 bg-red-a2 border-red-a6">
										<Text size="2" color="red" className="text-red-11">
											{error}
										</Text>
									</Card>
								)}

								<div className="flex gap-3 pt-4">
									<Button type="button" variant="ghost" size="3" onClick={onClose} className="flex-1">
										Cancel
									</Button>
									<Button type="submit" variant="solid" color="blue" size="3" disabled={loading} className="flex-1">
										{loading ? "Generating..." : "Generate Invoice"}
									</Button>
								</div>
							</form>
						</Card>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

