"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	isConfigured: boolean;
	signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
	signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null; emailConfirmationRequired?: boolean }>;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: false,
	isConfigured: false,
	signInWithPassword: async () => ({ error: null }),
	signUp: async () => ({ error: null }),
	signInWithGoogle: async () => {},
	signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();
	const isConfigured = supabase !== null;

	useEffect(() => {
		if (!supabase) {
			setLoading(false);
			return;
		}

		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, [supabase]);

	const signInWithPassword = async (email: string, password: string) => {
		if (!supabase) return { error: "Auth not configured" };

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return { error: error.message };
		}

		return { error: null };
	};

	const signUp = async (email: string, password: string, username?: string) => {
		if (!supabase) return { error: "Auth not configured" };

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username: username || email.split("@")[0],
				},
			},
		});

		if (error) {
			return { error: error.message };
		}

		// If no session, email confirmation is required
		return {
			error: null,
			emailConfirmationRequired: !data.session
		};
	};

	const signInWithGoogle = async () => {
		if (!supabase) return;
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
	};

	const signOut = async () => {
		if (!supabase) return;
		await supabase.auth.signOut();
		setUser(null);
		setSession(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				session,
				loading,
				isConfigured,
				signInWithPassword,
				signUp,
				signInWithGoogle,
				signOut
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
