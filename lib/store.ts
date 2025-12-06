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
	profilePicture?: string;
}

export type SponsorStatus = "active" | "pending" | "completed";

export interface SponsorDeal {
	id: string;
	brand: string;
	type: string;
	amount: number;
	status: SponsorStatus;
	deadline: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

const generateId = () => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export interface User {
	whop_user_id: string;
	whop_username: string;
	email?: string;
}

interface AppState {
	user: User | null;
	setUser: (user: User | null) => void;
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
	sponsors: SponsorDeal[];
	addSponsor: (deal: Omit<SponsorDeal, "id" | "createdAt" | "updatedAt">) => void;
	updateSponsor: (id: string, updates: Partial<SponsorDeal>) => void;
	removeSponsor: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
			user: null,
			setUser: (user) => set({ user }),
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
			sponsors: [
				{
					id: "deal-1",
					brand: "TechCorp",
					type: "Video Sponsorship",
					amount: 5000,
					status: "active",
					deadline: "2024-11-15",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: "deal-2",
					brand: "BrandX",
					type: "Product Placement",
					amount: 2500,
					status: "pending",
					deadline: "2024-11-20",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: "deal-3",
					brand: "StartupY",
					type: "Series Sponsorship",
					amount: 8000,
					status: "completed",
					deadline: "2024-11-05",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			],
			addSponsor: (deal) =>
				set((state) => {
					const now = new Date().toISOString();
					const newDeal: SponsorDeal = {
						...deal,
						id: generateId(),
						createdAt: now,
						updatedAt: now,
					};
					return { sponsors: [newDeal, ...state.sponsors] };
				}),
			updateSponsor: (id, updates) =>
				set((state) => ({
					sponsors: state.sponsors.map((deal) =>
						deal.id === id
							? { ...deal, ...updates, updatedAt: new Date().toISOString() }
							: deal
					),
				})),
			removeSponsor: (id) =>
				set((state) => ({
					sponsors: state.sponsors.filter((deal) => deal.id !== id),
				})),
		}),
		{
			name: "creatoros-storage",
		}
	)
);

