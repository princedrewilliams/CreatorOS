"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { Card, Button, Text, Badge } from "@whop/react/components";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useAppStore, type Task } from "@/lib/store";

interface CalendarProps {
	selectedDate?: Date;
	onDateSelect?: (date: Date) => void;
}

export function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const { getTasksByDate } = useAppStore();

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

	// Get first day of month to determine offset
	const firstDayOfWeek = getDay(monthStart);
	const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => i);

	const handlePreviousMonth = () => {
		setCurrentMonth(subMonths(currentMonth, 1));
	};

	const handleNextMonth = () => {
		setCurrentMonth(addMonths(currentMonth, 1));
	};

	const handleDateClick = (date: Date) => {
		onDateSelect?.(date);
	};

	const getTasksForDate = (date: Date): Task[] => {
		const dateStr = format(date, "yyyy-MM-dd");
		return getTasksByDate(dateStr);
	};

	const getPlatformColor = (platform: string) => {
		switch (platform) {
			case "youtube":
				return "red";
			default:
				return "blue";
		}
	};

	return (
		<Card size="3" variant="surface" className="p-6">
			{/* Calendar Header */}
			<div className="flex items-center justify-between mb-6">
				<Button
					variant="ghost"
					size="2"
					onClick={handlePreviousMonth}
				>
					<ChevronLeftIcon />
				</Button>
				<Text size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
					{format(currentMonth, "MMMM yyyy")}
				</Text>
				<Button
					variant="ghost"
					size="2"
					onClick={handleNextMonth}
				>
					<ChevronRightIcon />
				</Button>
			</div>

			{/* Day Headers */}
			<div className="grid grid-cols-7 gap-2 mb-2">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
					<Text
						key={day}
						size="2"
						weight="bold"
						color="gray"
						align="center"
						className="py-2"
					>
						{day}
					</Text>
				))}
			</div>

			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-2">
				{/* Empty cells before month start */}
				{daysBeforeMonth.map((_, i) => (
					<div key={`empty-${i}`} className="h-20" />
				))}

				{/* Days of the month */}
				{daysInMonth.map((date) => {
					const dateStr = format(date, "yyyy-MM-dd");
					const dayTasks = getTasksForDate(date);
					const isSelected = selectedDate && isSameDay(date, selectedDate);
					const isToday = isSameDay(date, new Date());
					const isCurrentMonth = isSameMonth(date, currentMonth);

					return (
						<motion.button
							key={dateStr}
							onClick={() => handleDateClick(date)}
							className={`
								h-20 rounded-lg border p-2 text-left transition-colors relative
								${isCurrentMonth ? "border-gray-a4 bg-gray-a2 dark:border-gray-a6 dark:bg-gray-a3" : "border-gray-a3 bg-gray-a1 dark:border-gray-a5 dark:bg-gray-a2"}
								${isToday ? "ring-2 ring-blue-9 border-blue-9 bg-blue-a3 dark:ring-blue-8 dark:border-blue-8 dark:bg-blue-a4 shadow-md" : ""}
								${isSelected && !isToday ? "ring-2 ring-blue-6 border-blue-6 dark:ring-blue-5 dark:border-blue-5" : ""}
								${isSelected && isToday ? "ring-2 ring-blue-9 border-blue-9 dark:ring-blue-8 dark:border-blue-8" : ""}
								hover:bg-gray-a3 dark:hover:bg-gray-a4 hover:border-gray-a6 dark:hover:border-gray-a7
							`}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							<div className="flex items-center justify-between">
								<Text
									size="2"
									weight={isToday ? "bold" : "medium"}
									className={isToday ? "text-blue-12 dark:text-blue-11" : isCurrentMonth ? "text-gray-12 dark:text-gray-12" : "text-gray-9 dark:text-gray-9"}
								>
									{format(date, "d")}
								</Text>
								{isToday && (
									<div className="w-1.5 h-1.5 rounded-full bg-blue-9 dark:bg-blue-8" />
								)}
							</div>
							{dayTasks.length > 0 && (
								<div className="mt-1 flex flex-wrap gap-1">
									{dayTasks.slice(0, 2).map((task) => (
										<Badge
											key={task.id}
											color={getPlatformColor(task.platforms[0]) as any}
											size="1"
											variant="soft"
											className="text-xs"
										>
											{task.platforms[0]}
										</Badge>
									))}
									{dayTasks.length > 2 && (
										<Text size="1" color="gray" className="text-xs text-gray-11 dark:text-gray-11">
											+{dayTasks.length - 2}
										</Text>
									)}
								</div>
							)}
						</motion.button>
					);
				})}
			</div>
		</Card>
	);
}

