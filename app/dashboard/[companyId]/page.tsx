"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

// Redirect to main dashboard - Whop may pass companyId but we use a single dashboard
export default function DashboardCompanyPage() {
	const params = useParams();
	const router = useRouter();
	const companyId = params?.companyId as string;

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

