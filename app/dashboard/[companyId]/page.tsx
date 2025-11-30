import { Button, Text } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk, isWhopConfigured } from "@/lib/whop-sdk";
import React from "react";

// Ensure this route is dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const dynamicParams = true;

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	
	if (!isWhopConfigured || !whopsdk) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
				<h1 className="text-8 font-bold text-gray-12 mb-4">Whop integration unavailable</h1>
				<p className="text-4 text-gray-10 mb-6">
					Add <code>WHOP_API_KEY</code> and related credentials to enable the dashboard preview for Whop data.
				</p>
				<Button variant="classic" size="3" asChild>
					<Link href="/">Go Home</Link>
				</Button>
			</div>
		);
	}

	try {
		// Validate companyId
		if (!companyId || typeof companyId !== "string" || companyId.trim().length === 0) {
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
					<h1 className="text-8 font-bold text-gray-12 mb-4">Invalid Company ID</h1>
					<p className="text-4 text-gray-10 mb-6">
						The company ID provided is invalid or missing.
					</p>
					<Button variant="classic" size="3" asChild>
						<Link href="/">Go Home</Link>
					</Button>
				</div>
			);
		}

		// Ensure the user is logged in on whop.
		let userId: string;
		try {
			const tokenResult = await whopsdk.verifyUserToken(await headers());
			userId = tokenResult.userId;
		} catch (authError) {
			console.error("[Whop Dashboard] Authentication error:", authError);
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
					<h1 className="text-8 font-bold text-gray-12 mb-4">Authentication Required</h1>
					<p className="text-4 text-gray-10 mb-6">
						Please log in to Whop to access this dashboard.
					</p>
					<Button variant="classic" size="3" asChild>
						<Link href="/">Go Home</Link>
					</Button>
				</div>
			);
		}

		// Check if user has admin access to this company
		let access;
		try {
			access = await whopsdk.users.checkAccess(companyId, { id: userId });
		} catch (accessError) {
			console.error("[Whop Dashboard] Access check error:", accessError);
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
					<h1 className="text-8 font-bold text-gray-12 mb-4">Access Check Failed</h1>
					<p className="text-4 text-gray-10 mb-6">
						Unable to verify your access to this company. Please try again later.
					</p>
					<Button variant="classic" size="3" asChild>
						<Link href="/">Go Home</Link>
					</Button>
				</div>
			);
		}

		// Dashboard apps should only be accessible to admins of the company
		if (!access || access.access_level !== "admin") {
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-8">
					<div className="max-w-md w-full text-center">
						<h1 className="text-8 font-bold text-gray-12 mb-4">Admin Access Required</h1>
						<p className="text-4 text-gray-10 mb-6">
							You must be an admin of this company to access the dashboard view.
						</p>
						<Button variant="classic" size="3" asChild>
							<Link href="/">Go Home</Link>
						</Button>
					</div>
				</div>
			);
		}

		// Fetch the necessary data for admin users
		let company, user;
		try {
			[company, user] = await Promise.all([
				whopsdk.companies.retrieve(companyId),
				whopsdk.users.retrieve(userId),
			]);
		} catch (fetchError) {
			console.error("[Whop Dashboard] Data fetch error:", fetchError);
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
					<h1 className="text-8 font-bold text-gray-12 mb-4">Error Loading Data</h1>
					<p className="text-4 text-gray-10 mb-6">
						Failed to load company or user data. Please try again later.
					</p>
					<Button variant="classic" size="3" asChild>
						<Link href="/">Go Home</Link>
					</Button>
				</div>
			);
		}

		const displayName = user?.name || user?.username ? `@${user.username}` : "User";

		return (
			<div className="flex flex-col p-8 gap-4">
				<div className="flex justify-between items-center gap-4">
					<h1 className="text-9">
						Hi <strong>{displayName}</strong>!
					</h1>
					<Link href="https://docs.whop.com/apps" target="_blank">
						<Button variant="classic" className="w-full" size="3">
							Developer Docs
						</Button>
					</Link>
				</div>

				<p className="text-3 text-gray-10">
					Welcome to CreatorOS dashboard! You have admin access to manage this company.
				</p>

				{/* Company ID Display */}
				<div className="p-4 rounded-lg border border-gray-a4 dark:border-gray-a6 bg-gray-a2 dark:bg-gray-a3">
					<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
						Company ID
					</Text>
					<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12 font-mono">
						{companyId}
					</Text>
				</div>

				<h3 className="text-6 font-bold">Company data</h3>
				<JsonViewer data={company} />

				<h3 className="text-6 font-bold">User data</h3>
				<JsonViewer data={user} />

				<h3 className="text-6 font-bold">Access data</h3>
				<JsonViewer data={access} />
			</div>
		);
	} catch (error) {
		console.error("[Whop Dashboard] Error:", error);
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
				<h1 className="text-8 font-bold text-gray-12 mb-4">Error Loading Dashboard</h1>
				<p className="text-4 text-gray-10 mb-6">
					{error instanceof Error ? error.message : "An unexpected error occurred while loading the dashboard."}
				</p>
				<Button variant="classic" size="3" asChild>
					<Link href="/">Go Home</Link>
				</Button>
			</div>
		);
	}
}

function JsonViewer({ data }: { data: unknown }) {
	return (
		<pre className="text-2 border border-gray-a4 rounded-lg p-4 bg-gray-a2 max-h-72 overflow-y-auto">
			<code className="text-gray-10">{JSON.stringify(data, null, 2)}</code>
		</pre>
	);
}
