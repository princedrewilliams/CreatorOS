import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Check if user has admin access to this company
	const access = await whopsdk.users.checkAccess(companyId, { id: userId });

	// Dashboard apps should only be accessible to admins of the company
	if (access.access_level !== "admin") {
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
	const [company, user] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
	]);

	const displayName = user.name || `@${user.username}`;

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

			<h3 className="text-6 font-bold">Company data</h3>
			<JsonViewer data={company} />

			<h3 className="text-6 font-bold">User data</h3>
			<JsonViewer data={user} />

			<h3 className="text-6 font-bold">Access data</h3>
			<JsonViewer data={access} />
		</div>
	);
}

function JsonViewer({ data }: { data: any }) {
	return (
		<pre className="text-2 border border-gray-a4 rounded-lg p-4 bg-gray-a2 max-h-72 overflow-y-auto">
			<code className="text-gray-10">{JSON.stringify(data, null, 2)}</code>
		</pre>
	);
}
