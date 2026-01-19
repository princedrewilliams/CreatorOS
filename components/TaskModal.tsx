"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Heading, Text, Button, Separator } from "@whop/react/components";
import { Cross2Icon, UploadIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type Task } from "@/lib/store";
import { ValidationSummary } from "@/app/components/replicate/ViolationBadge";
import type { ReplicationSettings, ValidationResult } from "@/lib/replicate/types";

interface TaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task?: Task;
	selectedDate?: Date;
}

export function TaskModal({ isOpen, onClose, task, selectedDate }: TaskModalProps) {
	const { addTask, updateTask, deleteTask, isPro } = useAppStore();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
	const [time, setTime] = useState("");
	const [platforms, setPlatforms] = useState<("youtube")[]>([]);
	const [status, setStatus] = useState<"planned" | "scheduled" | "posted" | "cancelled">("planned");
	const [video, setVideo] = useState<File | null>(null);

	// Replication settings
	const [replicationSettings, setReplicationSettings] = useState<ReplicationSettings[]>([]);
	const [selectedSettingsId, setSelectedSettingsId] = useState<string>("");
	const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
	const [validating, setValidating] = useState(false);

	// Fetch replication settings
	useEffect(() => {
		if (isOpen && isPro) {
			fetch("/api/replicate/settings")
				.then((res) => res.json())
				.then((data) => {
					if (data.settings) {
						setReplicationSettings(data.settings);
					}
				})
				.catch(console.error);
		}
	}, [isOpen, isPro]);

	// Validate against constraints when title or description changes
	useEffect(() => {
		if (!selectedSettingsId || !title) {
			setValidationResult(null);
			return;
		}

		const validateTimeout = setTimeout(async () => {
			setValidating(true);
			try {
				const response = await fetch("/api/replicate/validate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						settingsId: selectedSettingsId,
						upload: {
							title,
							description,
							tags: [],
						},
					}),
				});
				const data = await response.json();
				if (response.ok) {
					setValidationResult(data);
				}
			} catch (error) {
				console.error("Validation error:", error);
			} finally {
				setValidating(false);
			}
		}, 500);

		return () => clearTimeout(validateTimeout);
	}, [title, description, selectedSettingsId]);

	useEffect(() => {
		if (task) {
			setTitle(task.title);
			setDescription(task.description || "");
			setDate(task.date);
			setTime(task.time || "");
			setPlatforms(task.platforms);
			setStatus(task.status);
		} else {
			setTitle("");
			setDescription("");
			setDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
			setTime("");
			setPlatforms([]);
			setStatus("planned");
		}
		setSelectedSettingsId("");
		setValidationResult(null);
	}, [task, selectedDate]);

	const handlePlatformToggle = (platform: "youtube") => {
		setPlatforms((prev) =>
			prev.includes(platform)
				? prev.filter((p) => p !== platform)
				: [...prev, platform]
		);
	};

	const handleSubmit = () => {
		if (!title.trim() || platforms.length === 0) {
			alert("Please enter a title and select at least one platform");
			return;
		}

		if (task) {
			updateTask(task.id, {
				title,
				description,
				date,
				time,
				platforms,
				status,
			});
		} else {
			addTask({
				title,
				description,
				date,
				time,
				platforms,
				status,
			});
		}
		onClose();
	};

	const handleDelete = () => {
		if (task && confirm("Are you sure you want to delete this task?")) {
			deleteTask(task.id);
			onClose();
		}
	};

	const platformColors = {
		youtube: "red",
	} as const;

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
						className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-a6 bg-white dark:bg-gray-a2 p-6 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
							<div className="flex items-center justify-between mb-6">
								<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
									{task ? "Edit Task" : "Create New Task"}
								</Heading>
								<Button variant="ghost" size="1" onClick={onClose}>
									<Cross2Icon />
								</Button>
							</div>

							<div className="space-y-4">
								{/* Title */}
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Title *
									</Text>
									<input
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Enter task title..."
										className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors"
									/>
								</div>

								{/* Description */}
								<div>
									<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
										Description
									</Text>
									<textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Enter task description..."
										rows={3}
										className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors resize-none"
									/>
								</div>

								{/* Replication Settings (Pro Feature) */}
								{isPro && replicationSettings.length > 0 && (
									<div>
										<div className="flex items-center gap-2 mb-2">
											<Text size="2" weight="medium" className="text-gray-11 dark:text-gray-11">
												Apply Content Constraints
											</Text>
											<InfoCircledIcon className="w-4 h-4 text-gray-9" />
										</div>
										<select
											value={selectedSettingsId}
											onChange={(e) => setSelectedSettingsId(e.target.value)}
											className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors"
										>
											<option value="">No constraints (free-form)</option>
											{replicationSettings.map((settings) => (
												<option key={settings.id} value={settings.id}>
													Replicate: {settings.referenceChannelName}
												</option>
											))}
										</select>
										{selectedSettingsId && (
											<Text size="1" color="gray" className="mt-1 text-gray-10 dark:text-gray-10">
												Content will be validated against constraints from the selected channel
											</Text>
										)}
									</div>
								)}

								{/* Validation Results */}
								{selectedSettingsId && validationResult && (
									<div className="p-4 rounded-lg border border-gray-a6 bg-gray-a2 dark:bg-gray-a3">
										<div className="flex items-center gap-2 mb-3">
											<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
												Constraint Validation
											</Text>
											{validating && (
												<span className="w-4 h-4 border-2 border-blue-9 border-t-transparent rounded-full animate-spin" />
											)}
										</div>
										<ValidationSummary result={validationResult} />
									</div>
								)}

								{/* Date and Time */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Date *
										</Text>
										<input
											type="date"
											value={date}
											onChange={(e) => setDate(e.target.value)}
											className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors"
										/>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Time (optional)
										</Text>
										<input
											type="time"
											value={time}
											onChange={(e) => setTime(e.target.value)}
											className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors"
										/>
									</div>
								</div>

								<Separator />

								{/* Platforms */}
								<div>
									<Text size="2" weight="medium" className="mb-3 block text-gray-11 dark:text-gray-11">
										Platforms * (Select at least one)
									</Text>
									<div className="flex gap-3">
										{(["youtube"] as const).map((platform) => (
											<Button
												key={platform}
												variant={platforms.includes(platform) ? "soft" : "ghost"}
												color={platformColors[platform]}
												size="2"
												onClick={() => handlePlatformToggle(platform)}
												className="capitalize"
											>
												{platform}
											</Button>
										))}
									</div>
								</div>

								<Separator />

								{/* Video Upload for Scheduled Tasks */}
								{time && (
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Video File (for scheduled posting)
										</Text>
										<label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-a6 border-dashed rounded-lg cursor-pointer hover:bg-gray-a2 dark:hover:bg-gray-a3 transition-colors">
											{video ? (
												<Text size="2" className="text-gray-12 dark:text-gray-12">
													{video.name}
												</Text>
											) : (
												<div className="flex flex-col items-center">
													<UploadIcon className="w-6 h-6 text-gray-9 dark:text-gray-10 mb-1" />
													<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
														Click to upload video
													</Text>
												</div>
											)}
											<input
												type="file"
												accept="video/*"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file && file.type.startsWith("video/")) {
														setVideo(file);
													}
												}}
												className="hidden"
											/>
										</label>
										{video && (
											<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
												Video will be automatically posted at {time} on {date}
											</Text>
										)}
									</div>
								)}

								<Separator />

								{/* Status */}
								<div>
									<Text size="2" weight="medium" className="mb-3 block text-gray-11 dark:text-gray-11">
										Status
									</Text>
									<div className="flex gap-3">
										{(["planned", "scheduled", "posted", "cancelled"] as const).map((s) => (
											<Button
												key={s}
												variant={status === s ? "soft" : "ghost"}
												color={status === s ? "blue" : "gray"}
												size="2"
												onClick={() => setStatus(s)}
												className="capitalize"
											>
												{s}
											</Button>
										))}
									</div>
								</div>

								<Separator />

								{/* Actions */}
								<div className="flex items-center justify-between pt-4">
									{task && (
										<Button
											variant="ghost"
											color="red"
											size="2"
											onClick={handleDelete}
										>
											Delete
										</Button>
									)}
									<div className="flex gap-3 ml-auto">
										<Button variant="ghost" size="2" onClick={onClose}>
											Cancel
										</Button>
										<Button color="blue" size="2" variant="solid" onClick={handleSubmit}>
											{task ? "Update" : "Create"}
										</Button>
									</div>
								</div>
							</div>
						</motion.div>
					</>
				)}
		</AnimatePresence>
	);
}

