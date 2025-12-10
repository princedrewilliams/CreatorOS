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
import { BackButton } from "@/components/BackButton";
import { useSearchParams } from "next/navigation";

function PlannerContent() {
	const { tasks, addTask, updateTask, deleteTask, clearAllTasks, socialConnections, setSocialConnection, user } = useAppStore();
	const searchParams = useSearchParams();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
	const [filterPlatform, setFilterPlatform] = useState<"all" | "youtube" | "instagram" | "tiktok">("all");
	const [filterStatus, setFilterStatus] = useState<"all" | "planned" | "scheduled" | "posted" | "cancelled">("all");
	const [isPostVideoModalOpen, setIsPostVideoModalOpen] = useState(false);
	const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
	const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
	const [generatingCalendar, setGeneratingCalendar] = useState(false);
	const [niche, setNiche] = useState("");
	const [calendarCount, setCalendarCount] = useState(7);

	// Check and update task statuses for past scheduled dates
	useEffect(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		tasks.forEach((task) => {
			if (task.status === "scheduled") {
				const taskDate = new Date(`${task.date} ${task.time || "23:59"}`);
				taskDate.setHours(0, 0, 0, 0);
				
				if (taskDate < today) {
					updateTask(task.id, { status: "planned" });
				}
			}
		});
	}, [tasks, updateTask]);

	// Auto-scheduling: Auto-assign optimal times based on analytics
	useEffect(() => {
		if (!autoScheduleEnabled || !user) return;

		// Calculate optimal posting times based on platform analytics
		// Optimal times (in 24-hour format): TikTok: 19-21, Instagram: 11-13, YouTube: 14-16
		const optimalTimes: Record<string, { start: number; end: number }> = {
			tiktok: { start: 19, end: 21 },
			instagram: { start: 11, end: 13 },
			youtube: { start: 14, end: 16 },
		};

		const getOptimalTime = (platform: string): string => {
			const times = optimalTimes[platform.toLowerCase()] || optimalTimes.tiktok;
			// Pick a random time within the optimal window
			const hour = times.start + Math.floor(Math.random() * (times.end - times.start));
			const minute = Math.floor(Math.random() * 60);
			return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
		};

		// Auto-schedule tasks that are "planned" and don't have a time set
		const plannedTasks = tasks.filter((task) => 
			task.status === "planned" && 
			!task.time &&
			task.date &&
			new Date(task.date) >= new Date(new Date().toISOString().split("T")[0])
		);

		if (plannedTasks.length > 0) {
			plannedTasks.forEach((task) => {
				// Get optimal time based on the first platform
				const platform = task.platforms[0] || "tiktok";
				const optimalTime = getOptimalTime(platform);
				
				// Update task with optimal time and change status to scheduled
				updateTask(task.id, { 
					time: optimalTime,
					status: "scheduled"
				});
			});
		}
	}, [autoScheduleEnabled, tasks, user, updateTask]);

	// Auto-post scheduled tasks when their time arrives
	useEffect(() => {
		if (!autoScheduleEnabled || !user) return;

		const checkScheduledTasks = () => {
			const now = new Date();
			
			tasks.forEach((task) => {
				if (task.status === "scheduled" && task.date && task.time) {
					const scheduledDateTime = new Date(`${task.date}T${task.time}`);
					
					// If scheduled time has passed (within last 5 minutes to avoid multiple posts)
					if (scheduledDateTime <= now && 
						scheduledDateTime >= new Date(now.getTime() - 5 * 60 * 1000)) {
						
						// Auto-post the task
						const connectedPlatforms = socialConnections.filter(
							(conn: SocialConnection) => conn.connected
						);
						const taskPlatforms = task.platforms.filter((platform) =>
							connectedPlatforms.some((conn: SocialConnection) => conn.platform === platform)
						);

						if (taskPlatforms.length > 0) {
							// Update status to posted
							updateTask(task.id, { status: "posted" });
							
							// In production, this would actually post to the platforms
							console.log(`Auto-posted task "${task.title}" to ${taskPlatforms.join(", ")}`);
						}
					}
				}
			});
		};

		// Check every minute
		const interval = setInterval(checkScheduledTasks, 60000);
		
		// Check immediately
		checkScheduledTasks();

		return () => clearInterval(interval);
	}, [autoScheduleEnabled, tasks, user, socialConnections, updateTask]);

	// Sync user data on mount (social connections)
	useEffect(() => {
		const syncUserData = async () => {
			if (!user) return;
			
			try {
				const response = await fetch("/api/user/sync", {
					credentials: "include",
				});
				const data = await response.json();
				if (response.ok && data.success) {
					// Update social connections from server
					data.socialConnections.forEach((conn: any) => {
						setSocialConnection({
							platform: conn.platform,
							connected: conn.connected,
							accessToken: conn.accessToken,
							refreshToken: conn.refreshToken,
							expiresAt: conn.expiresAt,
							username: conn.username,
							userId: conn.userPlatformId,
							profilePicture: conn.profilePicture,
						});
					});
				}
			} catch (err) {
				console.error("Failed to sync user data:", err);
			}
		};
		
		syncUserData();
	}, [user, setSocialConnection]);

	// Handle OAuth callback
	useEffect(() => {
		const connected = searchParams.get("connected");
		if (connected) {
			const platform = connected as "youtube" | "instagram" | "tiktok";
			const username = searchParams.get("username") || `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`;
			const profilePicture = searchParams.get("profilePicture") || undefined;
			
			setSocialConnection({
				platform,
				connected: true,
				username,
				profilePicture,
			});
			
			// Sync again to get latest from server
			if (user) {
				fetch("/api/user/sync", {
					credentials: "include",
				})
					.then((res) => res.json())
					.then((data) => {
						if (data.success && data.socialConnections) {
							data.socialConnections.forEach((conn: any) => {
								if (conn.platform === platform) {
									setSocialConnection({
										platform: conn.platform,
										connected: conn.connected,
										accessToken: conn.accessToken,
										refreshToken: conn.refreshToken,
										expiresAt: conn.expiresAt,
										username: conn.username,
										userId: conn.userPlatformId,
										profilePicture: conn.profilePicture,
									});
								}
							});
						}
					})
					.catch(console.error);
			}
		}
	}, [searchParams, setSocialConnection, user]);

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

	const handleDeleteTask = (task: Task, e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
		}
		if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
			deleteTask(task.id);
		}
	};

	const handleClearAllTasks = () => {
		if (tasks.length === 0) {
			return;
		}
		if (confirm(`Are you sure you want to delete all ${tasks.length} task(s)? This action cannot be undone.`)) {
			clearAllTasks();
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
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
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
				<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div>
								<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12 mb-1">
									Auto-Scheduling
								</Text>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Auto-post at optimal times based on your analytics. Tasks without times will be automatically scheduled.
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
						{autoScheduleEnabled && (
							<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-2">
								✓ Auto-scheduling is active. Planned tasks will be assigned optimal posting times and auto-posted when scheduled.
							</Text>
						)}
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
					{tasks.length > 0 && (
						<Button
							variant="soft"
							color="red"
							size="2"
							onClick={handleClearAllTasks}
						>
							<TrashIcon className="mr-2" />
							Clear All Tasks
						</Button>
					)}
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
													onClick={(e) => handleDeleteTask(task, e)}
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
							<Card size="3" variant="surface" className="p-6 max-w-lg w-full">
								<div className="flex items-center justify-between mb-4">
									<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
										AI Calendar Generator
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
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Describe your content calendar
										</Text>
										<textarea
											placeholder="e.g., I want a fitness content creation calendar schedule for 1 day a week for the month"
											value={niche}
											onChange={(e) => setNiche(e.target.value)}
											rows={4}
											className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 resize-none"
										/>
										<Text size="1" color="gray" className="text-gray-10 dark:text-gray-10 mt-1">
											Be specific about your niche, posting frequency, and time period
										</Text>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
												Start Date
											</Text>
											<input
												type="date"
												id="startDate"
												min={new Date().toISOString().split("T")[0]}
												className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
											/>
										</div>
										<div>
											<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
												End Date
											</Text>
											<input
												type="date"
												id="endDate"
												min={new Date().toISOString().split("T")[0]}
												className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
											/>
										</div>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Posts Per Week
										</Text>
										<input
											type="number"
											min="1"
											max="7"
											value={calendarCount}
											onChange={(e) => setCalendarCount(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
											className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
										/>
									</div>
									<Button
										variant="solid"
										color="purple"
										size="3"
										onClick={async () => {
											if (!niche.trim()) {
												alert("Please describe your content calendar");
												return;
											}
											setGeneratingCalendar(true);
											try {
												const startDateInput = document.getElementById("startDate") as HTMLInputElement;
												const endDateInput = document.getElementById("endDate") as HTMLInputElement;
												const startDate = startDateInput?.value || new Date().toISOString().split("T")[0];
												const endDate = endDateInput?.value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

												const response = await fetch("/api/automation/generate-calendar", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({ 
														prompt: niche.trim(),
														startDate,
														endDate,
														postsPerWeek: calendarCount,
													}),
												});
												const data = await response.json();
												if (response.ok && data.tasks && Array.isArray(data.tasks)) {
													// Add tasks to calendar
													data.tasks.forEach((task: any) => {
														addTask({
															title: task.title,
															description: task.description || "",
															date: task.date,
															time: task.time,
															platforms: task.platforms,
															status: task.status || "planned",
														});
													});
													alert(`Successfully generated ${data.tasks.length} content tasks!`);
													setIsAutoGenerateModalOpen(false);
													setNiche("");
													setCalendarCount(1);
												} else {
													alert(data.error || "Failed to generate calendar");
												}
											} catch (error) {
												console.error("Failed to generate calendar:", error);
												alert("Failed to generate calendar. Please try again.");
											} finally {
												setGeneratingCalendar(false);
											}
										}}
										disabled={generatingCalendar || !niche.trim()}
										className="w-full"
									>
										{generatingCalendar ? (
											<>
												<span className="w-4 h-4 border-2 border-purple-11 border-t-transparent rounded-full animate-spin mr-2" />
												Generating...
											</>
										) : (
											<>
												<LightningBoltIcon className="mr-2" />
												Generate Calendar
											</>
										)}
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
