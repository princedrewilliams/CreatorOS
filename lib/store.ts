import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Task {
	id: string;
	title: string;
	description?: string;
	date: string; // YYYY-MM-DD format
	time?: string; // HH:MM format
	platforms: ("youtube" | "instagram" | "tiktok")[];
	status: "planned" | "scheduled" | "posted" | "cancelled";
	createdAt: string;
	updatedAt: string;
}

export interface SocialConnection {
	platform: "youtube" | "instagram" | "tiktok";
	connected: boolean;
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
	username?: string;
	userId?: string;
}

interface AppState {
	isPro: boolean;
	setIsPro: (isPro: boolean) => void;
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
	tasks: Task[];
	addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
	updateTask: (id: string, updates: Partial<Task>) => void;
	deleteTask: (id: string) => void;
	getTasksByDate: (date: string) => Task[];
	socialConnections: SocialConnection[];
	setSocialConnection: (connection: SocialConnection) => void;
	removeSocialConnection: (platform: "youtube" | "instagram" | "tiktok") => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
			isPro: false,
			setIsPro: (isPro) => set({ isPro }),
			sidebarOpen: false,
			setSidebarOpen: (open) => set({ sidebarOpen: open }),
			tasks: [],
			addTask: (task) =>
				set((state) => {
					const newTask: Task = {
						...task,
						id: Date.now().toString(),
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
					return { tasks: [...state.tasks, newTask] };
				}),
			updateTask: (id, updates) =>
				set((state) => ({
					tasks: state.tasks.map((task) =>
						task.id === id
							? { ...task, ...updates, updatedAt: new Date().toISOString() }
							: task
					),
				})),
			deleteTask: (id) =>
				set((state) => ({
					tasks: state.tasks.filter((task) => task.id !== id),
				})),
            getTasksByDate: (date) => get().tasks.filter((task) => task.date === date),
			socialConnections: [
				{ platform: "youtube", connected: false },
				{ platform: "instagram", connected: false },
				{ platform: "tiktok", connected: false },
			],
			setSocialConnection: (connection) =>
				set((state) => ({
					socialConnections: state.socialConnections.map((conn) =>
						conn.platform === connection.platform ? connection : conn
					),
				})),
			removeSocialConnection: (platform) =>
				set((state) => ({
					socialConnections: state.socialConnections.map((conn) =>
						conn.platform === platform
							? { platform, connected: false }
							: conn
					),
				})),
		}),
		{
			name: "creatoros-storage",
		}
	)
);

