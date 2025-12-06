"use client";

import { useState, useEffect } from "react";
import { Heading, Text, Card, Button } from "@whop/react/components";
import { EnvelopeOpenIcon, LockOpen1Icon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null);
	const router = useRouter();

	useEffect(() => {
		// Check if user is already logged in
		fetch("/api/auth/me")
			.then((res) => res.json())
			.then((data) => {
				if (data.success && data.user) {
					setUser(data.user);
				}
			})
			.catch(() => {
				// Not logged in
			});
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to login");
			}

			setUser(data.user);
			// Redirect to dashboard or previous page
			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to login");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
			});
			setUser(null);
			setEmail("");
			router.push("/");
		} catch (err) {
			console.error("Failed to logout:", err);
		} finally {
			setLoading(false);
		}
	};

	if (user) {
		return (
			<div className="flex items-center justify-center min-h-screen p-4">
				<Card size="3" variant="surface" className="p-8 max-w-md w-full">
					<div className="text-center space-y-4">
						<LockOpen1Icon className="w-16 h-16 mx-auto text-green-11" />
						<Heading size="6" as="h1" className="text-gray-12 dark:text-gray-12">
							Welcome back, {user.whop_username}!
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							You are logged in as {user.email || user.whop_username}
						</Text>
						<div className="flex gap-3 pt-4">
							<Button
								variant="solid"
								color="blue"
								size="3"
								onClick={() => router.push("/dashboard")}
								className="flex-1"
							>
								Go to Dashboard
							</Button>
							<Button
								variant="ghost"
								color="gray"
								size="3"
								onClick={handleLogout}
								disabled={loading}
							>
								Logout
							</Button>
						</div>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-screen p-4 bg-gray-a2 dark:bg-gray-a1">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-md"
			>
				<Card size="3" variant="surface" className="p-8">
					<div className="text-center mb-6">
						<EnvelopeOpenIcon className="w-16 h-16 mx-auto mb-4 text-blue-11" />
						<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
							Login to CreatorOS
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							Enter your email to access your content library and saved videos
						</Text>
					</div>

					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
								Email
							</Text>
							<input
								type="email"
								placeholder="your@email.com"
								value={email}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
								required
								disabled={loading}
								autoFocus
								className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
							/>
						</div>

						{error && (
							<Card size="1" variant="surface" className="p-3 bg-red-a2 border-red-a6">
								<Text size="2" color="red" className="text-red-11">
									{error}
								</Text>
							</Card>
						)}

						<Button
							type="submit"
							variant="solid"
							color="blue"
							size="3"
							className="w-full"
							disabled={loading || !email}
						>
							{loading ? "Logging in..." : "Login"}
						</Button>
					</form>

					<div className="mt-6 pt-6 border-t border-gray-a6">
						<Text size="2" color="gray" className="text-center text-gray-10 dark:text-gray-11">
							By logging in, you agree to our Terms of Service and Privacy Policy.
							<br />
							<br />
							<Text size="2" color="gray" className="text-gray-10">
								Manage your membership at{" "}
								<a
									href="https://whop.com/@me/settings/memberships/"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-11 hover:underline"
								>
									whop.com/@me/settings/memberships/
								</a>
							</Text>
						</Text>
					</div>
				</Card>
			</motion.div>
		</div>
	);
}

