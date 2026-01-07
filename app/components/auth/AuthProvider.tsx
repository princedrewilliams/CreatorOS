"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	isConfigured: boolean;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: false,
	isConfigured: false,
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
			value={{ user, session, loading, isConfigured, signInWithGoogle, signOut }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
