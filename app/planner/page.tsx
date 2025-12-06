"use client";

import { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { PlusIcon, CheckIcon, Pencil1Icon, TrashIcon, PaperPlaneIcon, LightningBoltIcon, VideoIcon, CalendarIcon, Cross2Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type Task, type SocialConnection } from "@/lib/store";
import { Calendar } from "@/components/Calendar";
import { TaskModal } from "@/components/TaskModal";
import { SocialConnections } from "@/components/SocialConnections";
import { PostVideoModal } from "@/components/PostVideoModal";
import { useSearchParams } from "next/navigation";

function PlannerContent() {
	const { tasks, addTask, updateTask, deleteTask, socialConnections, setSocialConnection } = useAppStore();
	const searchParams = useSearchParams();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
	const [filterPlatform, setFilterPlatform] = useState<"all" | "youtube" | "instagram" | "tiktok">("all");
	const [filterStatus, setFilterStatus] = useState<"all" | "planned" | "scheduled" | "posted" | "cancelled">("all");
	const [isPostVideoModalOpen, setIsPostVideoModalOpen] = useState(false);
	const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
	const [isAutoFormatModalOpen, setIsAutoFormatModalOpen] = useState(false);
	const [isAutoRepurposeModalOpen, setIsAutoRepurposeModalOpen] = useState(false);
	const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
	const [generatingCalendar, setGeneratingCalendar] = useState(false);
	const [niche, setNiche] = useState("");

	// Handle OAuth callback
	useEffect(() => {
		const connected = searchParams.get("connected");
		if (connected) {
			const platform = connected as "youtube" | "instagram" | "tiktok";
			setSocialConnection({
				platform,
				connected: true,
				username: `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
			});
		}
	}, [searchParams, setSocialConnection]);

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
		setIsTaskModalOpen(true);
		setEditingTask(undefined);
	};

	const handleCreateTask = () => {
		setEditingTask(undefined);
		setIsTaskModalOpen(true);
	};

	const handleEditTask = (task: Task) => {
		setEditingTask(task);
		setIsTaskModalOpen(true);
	};

	const handleDeleteTask = (task: Task) => {
		if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
			deleteTask(task.id);
		}
	};

	const handlePost = async (task: Task) => {
		const connectedPlatforms = socialConnections.filter((conn: SocialConnection) => conn.connected);
		const taskPlatforms = task.platforms.filter((platform) =>
			connectedPlatforms.some((conn: SocialConnection) => conn.platform === platform)
		);

		if (taskPlatforms.length === 0) {
			alert("Please connect at least one social media account for this task's platforms");
			return;
		}

		try {
			// Call cross-posting API
			const response = await fetch("/api/crosspost", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					taskId: task.id,
					title: task.title,
					description: task.description,
					platforms: taskPlatforms,
				}),
			});

			if (response.ok) {
				updateTask(task.id, { status: "posted" });
				alert(`Successfully posted to ${taskPlatforms.join(", ")}!`);
			} else {
				const error = await response.json();
				alert(`Failed to post: ${error.error || "Unknown error"}`);
			}
		} catch (error) {
			console.error("Error posting:", error);
			alert("Failed to post. Please try again.");
		}
	};

	const getPlatformColor = (platform: string): "red" | "purple" | "cyan" | "gray" | "blue" => {
		switch (platform) {
			case "youtube":
				return "red";
			case "instagram":
				return "purple";
			case "tiktok":
				return "cyan";
			default:
				return "blue";
		}
	};

	const getStatusColor = (status: string): "blue" | "yellow" | "green" | "red" | "gray" => {
		switch (status) {
			case "planned":
				return "blue";
			case "scheduled":
				return "yellow";
			case "posted":
				return "green";
			case "cancelled":
				return "red";
			default:
				return "gray";
		}
	};

	// Filter tasks
	const filteredTasks = tasks.filter((task: Task) => {
		if (filterPlatform !== "all" && !task.platforms.includes(filterPlatform)) {
			return false;
		}
		if (filterStatus !== "all" && task.status !== filterStatus) {
			return false;
		}
		return true;
	});

	// Sort tasks by date
	const sortedTasks = [...filteredTasks].sort((a: Task, b: Task) => {
		const dateA = new Date(`${a.date} ${a.time || "00:00"}`);
		const dateB = new Date(`${b.date} ${b.time || "00:00"}`);
		return dateA.getTime() - dateB.getTime();
	});

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Content Planner
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Plan and schedule your content across all platforms
					</Text>
				</div>
				<div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
					<Button color="purple" size="3" variant="solid" onClick={() => setIsAutoGenerateModalOpen(true)}>
						<LightningBoltIcon className="mr-2" />
						Auto-Generate Calendar
					</Button>
					<Button color="blue" size="3" variant="solid" onClick={() => setIsPostVideoModalOpen(true)}>
						<PaperPlaneIcon className="mr-2" />
						Post to All
					</Button>
					<Button color="green" size="3" variant="solid" onClick={handleCreateTask}>
						<PlusIcon className="mr-2" />
						New Task
					</Button>
				</div>
			</div>

			{/* Automation Features */}
			<Card size="3" variant="surface" className="p-6">
				<div className="flex items-center gap-2 mb-4">
					<LightningBoltIcon className="w-5 h-5 text-purple-9" />
					<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
						Automation Features
					</Heading>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div>
								<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12 mb-1">
									Auto-Format Video
								</Text>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Upload 1 video → Get TikTok, IG Reel, and YouTube Shorts versions automatically
								</Text>
							</div>
						</div>
						<Button
							variant="ghost"
							color="purple"
							size="2"
							onClick={() => setIsAutoFormatModalOpen(true)}
							className="w-full"
						>
							<VideoIcon className="mr-2" />
							Format Video
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div>
								<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12 mb-1">
									Auto-Repurpose
								</Text>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Upload long video → Auto-create 3-5 clips with captions and scheduling
								</Text>
							</div>
						</div>
						<Button
							variant="ghost"
							color="purple"
							size="2"
							onClick={() => setIsAutoRepurposeModalOpen(true)}
							className="w-full"
						>
							<VideoIcon className="mr-2" />
							Repurpose Video
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div>
								<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12 mb-1">
									Auto-Scheduling
								</Text>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Auto-post at optimal times based on your analytics
								</Text>
							</div>
						</div>
						<Button
							variant={autoScheduleEnabled ? "soft" : "ghost"}
							color={autoScheduleEnabled ? "green" : "purple"}
							size="2"
							onClick={() => setAutoScheduleEnabled(!autoScheduleEnabled)}
							className="w-full"
						>
							<CalendarIcon className="mr-2" />
							{autoScheduleEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
				</div>
			</Card>

			{/* Social Connections */}
			<SocialConnections />

			{/* Calendar */}
			<Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />

			{/* Filters */}
			<Card size="2" variant="surface" className="p-4">
				<div className="flex items-center gap-4 flex-wrap">
					<Text size="2" weight="medium" color="gray" className="text-gray-11 dark:text-gray-11">
						Filter by Platform:
					</Text>
					<div className="flex gap-2">
						{(["all", "youtube", "instagram", "tiktok"] as const).map((platform) => (
							<Button
								key={platform}
								variant={filterPlatform === platform ? "soft" : "ghost"}
								color={filterPlatform === platform ? "blue" : "gray"}
								size="2"
								onClick={() => setFilterPlatform(platform)}
								className="capitalize"
							>
								{platform}
							</Button>
						))}
					</div>
					<Separator orientation="vertical" className="h-6" />
					<Text size="2" weight="medium" color="gray" className="text-gray-11 dark:text-gray-11">
						Filter by Status:
					</Text>
					<div className="flex gap-2">
						{(["all", "planned", "scheduled", "posted", "cancelled"] as const).map((status) => (
							<Button
								key={status}
								variant={filterStatus === status ? "soft" : "ghost"}
								color={filterStatus === status ? "blue" : "gray"}
								size="2"
								onClick={() => setFilterStatus(status)}
								className="capitalize"
							>
								{status}
							</Button>
						))}
					</div>
				</div>
			</Card>

			{/* Tasks List */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
						Tasks ({sortedTasks.length})
					</Heading>
				</div>
				<AnimatePresence>
					{sortedTasks.length > 0 ? (
						<div className="space-y-3">
							{sortedTasks.map((task, index) => (
								<motion.div
									key={task.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card size="2" variant="surface" className="p-4 hover:border-blue-6 dark:hover:border-blue-5 transition-colors">
										<div className="flex items-center justify-between gap-4">
											<div className="flex items-center gap-3 flex-1">
												<div className="w-10 h-10 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center flex-shrink-0">
													<CheckIcon className="w-5 h-5 text-blue-11 dark:text-blue-10" />
												</div>
												<div className="flex-1 min-w-0">
													<Heading size="4" as="h3" className="mb-1 truncate text-gray-12 dark:text-gray-12">
														{task.title}
													</Heading>
													{task.description && (
														<Text size="2" color="gray" className="mb-2 line-clamp-1 text-gray-11 dark:text-gray-11">
															{task.description}
														</Text>
													)}
													<div className="flex items-center gap-2 flex-wrap">
														<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
															{format(new Date(task.date), "MMM d, yyyy")}
															{task.time && ` at ${task.time}`}
														</Text>
														<Separator orientation="vertical" className="h-4" />
														{task.platforms.map((platform: "youtube" | "instagram" | "tiktok") => (
															<Badge
																key={platform}
																color={getPlatformColor(platform)}
																size="1"
																variant="soft"
																className="capitalize"
															>
																{platform}
															</Badge>
														))}
														<Badge
															color={getStatusColor(task.status)}
															size="1"
															variant="soft"
															className="capitalize"
														>
															{task.status}
														</Badge>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2 flex-shrink-0">
												{task.status !== "posted" && (
													<Button
														variant="ghost"
														color="green"
														size="2"
														onClick={() => handlePost(task)}
														title="Post to social media"
													>
														<PaperPlaneIcon />
													</Button>
												)}
												<Button
													variant="ghost"
													size="2"
													onClick={() => handleEditTask(task)}
													title="Edit task"
												>
													<Pencil1Icon />
												</Button>
												<Button
													variant="ghost"
													color="red"
													size="2"
													onClick={() => handleDeleteTask(task)}
													title="Delete task"
												>
													<TrashIcon />
												</Button>
											</div>
										</div>
									</Card>
								</motion.div>
							))}
						</div>
					) : (
						<Card size="2" variant="surface" className="p-8 text-center">
							<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
								No tasks found. Create your first task to get started!
							</Text>
						</Card>
					)}
				</AnimatePresence>
			</div>

			{/* Task Modal */}
			<TaskModal
				isOpen={isTaskModalOpen}
				onClose={() => {
					setIsTaskModalOpen(false);
					setEditingTask(undefined);
				}}
				task={editingTask}
				selectedDate={selectedDate}
			/>

			{/* Post Video Modal */}
			<PostVideoModal
				isOpen={isPostVideoModalOpen}
				onClose={() => setIsPostVideoModalOpen(false)}
			/>

			{/* Auto Format Modal */}
			<AutoFormatModal
				isOpen={isAutoFormatModalOpen}
				onClose={() => setIsAutoFormatModalOpen(false)}
			/>

			{/* Auto Repurpose Modal */}
			<AutoRepurposeModal
				isOpen={isAutoRepurposeModalOpen}
				onClose={() => setIsAutoRepurposeModalOpen(false)}
				onClipsGenerated={(clips) => {
					// Optionally add clips as tasks to calendar
					console.log("Clips generated:", clips);
				}}
			/>

			{/* Auto-Generate Calendar Modal */}
			<AnimatePresence>
				{isAutoGenerateModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md"
						onClick={() => setIsAutoGenerateModalOpen(false)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
						>
							<Card size="3" variant="surface" className="p-6 max-w-md w-full">
								<div className="flex items-center justify-between mb-4">
									<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
										Auto-Generate Content Calendar
									</Heading>
									<Button
										variant="ghost"
										size="2"
										onClick={() => setIsAutoGenerateModalOpen(false)}
									>
										<Cross2Icon />
									</Button>
								</div>
								<div className="space-y-4">
									<div>
										<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
											Enter your niche
										</Text>
										<input
											type="text"
											placeholder="e.g., fitness, gaming, beauty"
											value={niche}
											onChange={(e) => setNiche(e.target.value)}
											className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
										/>
									</div>
									<Button
										variant="solid"
										color="purple"
										size="3"
										onClick={async () => {
											if (!niche) {
												alert("Please enter a niche");
												return;
											}
											setGeneratingCalendar(true);
											try {
												const response = await fetch("/api/automation/generate-content-calendar", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({ niche, count: 7 }),
												});
												const data = await response.json();
												if (response.ok && data.calendar) {
													// Add tasks to calendar
													let tasksAdded = 0;
													data.calendar.forEach((item: any) => {
														const scheduledDate = new Date(item.scheduledDate);
														const dateStr = scheduledDate.toISOString().split("T")[0];
														
														// Add main task for the content idea
														addTask({
															title: item.title,
															description: `${item.hook}\n\n${item.caption}`,
															date: dateStr,
															time: item.bestPostTime || "12:00",
															platforms: [item.platform],
															status: "planned",
														});
														tasksAdded++;

														// Add subtasks if they exist
														if (item.tasks && Array.isArray(item.tasks)) {
															item.tasks.forEach((subtask: any) => {
																const taskDate = new Date(subtask.dueDate);
																const taskDateStr = taskDate.toISOString().split("T")[0];
																addTask({
																	title: subtask.title,
																	description: `Part of: ${item.title}`,
																	date: taskDateStr,
																	platforms: [item.platform],
																	status: subtask.status || "planned",
																});
																tasksAdded++;
															});
														}
													});
													alert(`Generated ${data.count} content ideas and added ${tasksAdded} tasks to your calendar!`);
													setIsAutoGenerateModalOpen(false);
													setNiche("");
												} else {
													alert(data.error || "Failed to generate calendar");
												}
											} catch (error) {
												alert("Failed to generate calendar");
											} finally {
												setGeneratingCalendar(false);
											}
										}}
										disabled={generatingCalendar || !niche}
										className="w-full"
									>
										{generatingCalendar ? "Generating..." : "Generate Calendar"}
									</Button>
								</div>
							</Card>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default function PlannerPage() {
	return (
		<Suspense fallback={
			<div className="flex items-center justify-center min-h-screen">
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">Loading...</Text>
			</div>
		}>
			<PlannerContent />
		</Suspense>
	);
}
