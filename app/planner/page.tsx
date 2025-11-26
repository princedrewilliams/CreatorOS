"use client";

import { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, PlusIcon, CheckIcon, Pencil1Icon, TrashIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type Task, type SocialConnection } from "@/lib/store";
import { Calendar } from "@/components/Calendar";
import { TaskModal } from "@/components/TaskModal";
import { SocialConnections } from "@/components/SocialConnections";
import { PostVideoModal } from "@/components/PostVideoModal";
import { useSearchParams } from "next/navigation";

function PlannerContent() {
	const { tasks, updateTask, deleteTask, socialConnections, setSocialConnection } = useAppStore();
	const searchParams = useSearchParams();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
	const [filterPlatform, setFilterPlatform] = useState<"all" | "youtube" | "instagram" | "tiktok">("all");
	const [filterStatus, setFilterStatus] = useState<"all" | "planned" | "scheduled" | "posted" | "cancelled">("all");
	const [isPostVideoModalOpen, setIsPostVideoModalOpen] = useState(false);

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
					<Link href="/dashboard">
						<Button variant="ghost" size="2" className="mb-3 sm:mb-4">
							<ArrowLeftIcon className="mr-2" />
							Back
						</Button>
					</Link>
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Content Planner
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Plan and schedule your content across all platforms
					</Text>
				</div>
				<div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
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
