import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk, isWhopConfigured } from "@/lib/whop-sdk";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	if (!isWhopConfigured || !whopsdk) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
				<h1 className="text-8 font-bold text-gray-12 mb-4">Whop integration unavailable</h1>
				<p className="text-4 text-gray-10 mb-6">
					Add <code>WHOP_API_KEY</code> and related credentials to enable experience data previews.
				</p>
				<Button variant="classic" size="3" asChild>
					<Link href="/">Go Home</Link>
				</Button>
			</div>
		);
	}

	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Check if user has access to this experience
	const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

	// Validate experience access - deny if user doesn't have access
	if (!access.has_access) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-8">
				<div className="max-w-md w-full text-center">
					<h1 className="text-8 font-bold text-gray-12 mb-4">Access Denied</h1>
					<p className="text-4 text-gray-10 mb-6">
						You don't have access to this experience. Please check your membership or contact support.
					</p>
					<Button variant="classic" size="3" asChild>
						<Link href="/">Go Home</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Fetch the necessary data for users with access
	const [experience, user] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
	]);

	const displayName = user.name || `@${user.username}`;

	// access.access_level can be:
	// "customer" - User has a valid membership
	// "admin" - User is a team member

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
				Welcome to CreatorOS experience! Your access level: <strong>{access.access_level}</strong>
			</p>

			<h3 className="text-6 font-bold">Experience data</h3>
			<JsonViewer data={experience} />

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
