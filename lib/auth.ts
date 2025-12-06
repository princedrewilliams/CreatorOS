import { cookies } from "next/headers";

export interface User {
	whop_user_id: string;
	whop_username: string;
	email?: string;
}

export async function getCurrentUser(): Promise<User | null> {
	try {
		const cookieStore = await cookies();
		const userId = cookieStore.get("whop_user_id")?.value;
		const username = cookieStore.get("whop_username")?.value;

		if (!userId || !username) {
			return null;
		}

		const email = cookieStore.get("user_email")?.value;

		return {
			whop_user_id: userId,
			whop_username: username,
			email: email || undefined,
		};
	} catch (error) {
		console.error("[Auth] Error getting current user:", error);
		return null;
	}
}

export async function setUserSession(user: User) {
	const cookieStore = await cookies();
	cookieStore.set("whop_user_id", user.whop_user_id, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 30, // 30 days
		path: "/",
	});
	cookieStore.set("whop_username", user.whop_username, {
		httpOnly: false, // Allow client-side access for display
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 30, // 30 days
		path: "/",
	});
	if (user.email) {
		cookieStore.set("user_email", user.email, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});
	}
}

export async function clearUserSession() {
	const cookieStore = await cookies();
	cookieStore.delete("whop_user_id");
	cookieStore.delete("whop_username");
	cookieStore.delete("user_email");
}
