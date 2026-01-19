import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Task {
	id: string;
	title: string;
	description?: string;
	date: string; // YYYY-MM-DD format
	time?: string; // HH:MM format
	platforms: ("youtube")[];
	status: "planned" | "scheduled" | "posted" | "cancelled";
	createdAt: string;
	updatedAt: string;
}

export interface SocialConnection {
	platform: "youtube";
	connected: boolean;
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
	username?: string;
	userId?: string;
	userPlatformId?: string; // Platform-specific user ID (e.g., TikTok open_id/union_id, YouTube channel ID)
	profilePicture?: string;
}

export type SponsorStatus = "lead" | "negotiating" | "active" | "completed";
export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export interface SponsorDeal {
	id: string;
	name: string; // Sponsor name
	contactEmail?: string;
	dealValue: number; // Deal value in USD
	deliverables: string; // e.g. "1 video mention, 60s integration"
	youtubeVideoIds: string[]; // Array of YouTube video IDs linked to this sponsor
	status: SponsorStatus;
	paymentStatus: PaymentStatus;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	notes?: string;
	createdAt: string;
	updatedAt: string;
	// Legacy fields for backward compatibility
	brand?: string;
	type?: string;
	amount?: number;
	deadline?: string;
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
	syncProStatus: () => Promise<void>;
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
	tasks: Task[];
	addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
	updateTask: (id: string, updates: Partial<Task>) => void;
	deleteTask: (id: string) => void;
	clearAllTasks: () => void;
	getTasksByDate: (date: string) => Task[];
	socialConnections: SocialConnection[];
	setSocialConnection: (connection: SocialConnection) => void;
	removeSocialConnection: (platform: "youtube") => void;
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
			syncProStatus: async () => {
				try {
					const response = await fetch("/api/user/pro-status");
					const data = await response.json();
					if (response.ok) {
						set({ isPro: data.isPro });
					}
				} catch (error) {
					console.error("Failed to sync Pro status:", error);
				}
			},
			sidebarOpen: false,
			setSidebarOpen: (open) => set({ sidebarOpen: open }),
			tasks: [],
			addTask: (task) =>
				set((state) => {
					const newTask: Task = {
						...task,
						id: generateId(),
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
			clearAllTasks: () =>
				set({ tasks: [] }),
            getTasksByDate: (date) => get().tasks.filter((task) => task.date === date),
			socialConnections: [
				{ platform: "youtube", connected: false },
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
			sponsors: [],
			addSponsor: (deal) =>
				set((state) => {
					const now = new Date().toISOString();
					// Handle backward compatibility with old sponsor format
					const newDeal: SponsorDeal = {
						...deal,
						// Map old fields to new fields if needed
						name: deal.name || deal.brand || "Unknown Sponsor",
						dealValue: deal.dealValue || deal.amount || 0,
						deliverables: deal.deliverables || deal.type || "",
						youtubeVideoIds: deal.youtubeVideoIds || [],
						status: deal.status || "lead",
						paymentStatus: deal.paymentStatus || "unpaid",
						startDate: deal.startDate || now.split("T")[0],
						endDate: deal.endDate || deal.deadline || now.split("T")[0],
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

