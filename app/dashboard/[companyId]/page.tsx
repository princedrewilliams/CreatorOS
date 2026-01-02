"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to main dashboard - Whop may pass companyId but we use a single dashboard
export default function DashboardCompanyPage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to main dashboard page
		router.replace("/dashboard");
	}, [router]);

	// Show loading state while redirecting
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-gray-11">Loading...</div>
		</div>
	);
}

