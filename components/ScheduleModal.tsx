"use client";

import { useState, FormEvent } from "react";
import { Heading, Text, Card, Button } from "@whop/react/components";
import { Cross2Icon, UploadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface ScheduleModalProps {
	isOpen: boolean;
	onClose: () => void;
	optimalTime: string; // e.g., "3 PM"
}

export function ScheduleModal({ isOpen, onClose, optimalTime }: ScheduleModalProps) {
	const [files, setFiles] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const selectedFiles = Array.from(e.target.files).slice(0, 10);
			setFiles(selectedFiles);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (files.length === 0) {
			alert("Please select at least one video file");
			return;
		}

		setUploading(true);
		try {
			// TODO: Implement video upload and scheduling logic
			// For now, just show a success message
			alert(`Scheduled ${files.length} video(s) for ${optimalTime}`);
			setFiles([]);
			onClose();
		} catch (error) {
			alert("Failed to schedule videos");
		} finally {
			setUploading(false);
		}
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
									<UploadIcon className="w-5 h-5 text-purple-11" />
									<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
										Schedule Videos for Optimal Time
									</Heading>
								</div>
								<Button variant="ghost" size="1" onClick={onClose}>
									<Cross2Icon className="w-4 h-4" />
								</Button>
							</div>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Optimal Posting Time
									</Text>
									<Card size="1" variant="surface" className="p-3 bg-purple-a2">
										<Text size="3" weight="bold" className="text-purple-11">
											{optimalTime}
										</Text>
									</Card>
								</div>

								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Upload Videos (up to 10)
									</Text>
									<input
										type="file"
										accept="video/*"
										multiple
										onChange={handleFileChange}
										className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
									/>
									{files.length > 0 && (
										<div className="mt-2 space-y-1">
											{files.map((file, index) => (
												<Text key={index} size="2" className="text-gray-11 dark:text-gray-11">
													{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
												</Text>
											))}
										</div>
									)}
								</div>

								<div className="flex gap-3 pt-4">
									<Button type="button" variant="ghost" size="3" onClick={onClose} className="flex-1">
										Cancel
									</Button>
									<Button type="submit" variant="solid" color="purple" size="3" disabled={uploading || files.length === 0} className="flex-1">
										{uploading ? "Scheduling..." : `Schedule ${files.length} Video${files.length !== 1 ? "s" : ""}`}
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

