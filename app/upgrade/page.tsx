"use client";

import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, CheckIcon, StarIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const features = [
	"Unlimited AI-powered video clips",
	"Unlimited thumbnail generation",
	"Advanced analytics dashboard",
	"Priority support",
	"Custom branding",
	"Export to all platforms",
];

const plans = [
	{
		name: "Pro Monthly",
		price: "$29",
		period: "per month",
		description: "Perfect for individual creators",
		features: [...features],
		popular: false,
	},
	{
		name: "Pro Annual",
		price: "$249",
		period: "per year",
		description: "Best value - save 28%",
		features: [...features, "Early access to new features"],
		popular: true,
	},
];

export default function UpgradePage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { setIsPro, user } = useAppStore();
	const router = useRouter();

	useEffect(() => {
		// Check if user is logged in
		if (!user) {
			router.push("/login?redirect=/upgrade");
		}
	}, [user, router]);

	const handlePurchase = async (planName: string) => {
		if (!user) {
			setError("Please login to purchase a plan");
			router.push("/login?redirect=/upgrade");
			return;
		}

		setLoading(true);
		setError(null);
		
		// TODO: Integrate with Whop in-app purchases
		// Reference: https://docs.whop.com/apps/guides/payins#in-app-purchases
		try {
			const planType = planName === "Pro Monthly" ? "monthly" : "annual";
			
			const response = await fetch("/api/subscription/purchase", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planType }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Purchase failed");
			}

			// Update local state
			setIsPro(true);
			alert("Purchase successful! You now have Pro access. Your subscription is saved to your account and will sync across all devices.");
		} catch (error) {
			setError(error instanceof Error ? error.message : "Purchase failed");
			console.error("Purchase failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/dashboard">
						<Button variant="ghost" size="2" className="mb-4">
							<ArrowLeftIcon className="mr-2" />
							Back
						</Button>
					</Link>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Upgrade to Pro
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Unlock all features and take your content creation to the next level
					</Text>
				</div>
			</div>

			{/* Features List */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Pro Features
				</Heading>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{features.map((feature, index) => (
						<motion.div
							key={feature}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<div className="flex items-center gap-2">
								<div className="w-5 h-5 rounded-full bg-green-a2 dark:bg-green-a3 flex items-center justify-center">
									<CheckIcon className="w-3 h-3 text-green-11 dark:text-green-10" />
								</div>
								<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
									{feature}
								</Text>
							</div>
						</motion.div>
					))}
				</div>
			</Card>

			{/* Pricing Plans */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{plans.map((plan, index) => (
					<motion.div
						key={plan.name}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Card 
							size="3" 
							variant={plan.popular ? "surface" : "surface"}
							className={`p-6 h-full relative ${plan.popular ? "border-blue-6 ring-2 ring-blue-a6" : ""}`}
						>
							{plan.popular && (
								<Badge 
									color="blue" 
									size="2" 
									variant="solid" 
									className="absolute -top-3 right-6"
								>
									<StarIcon className="w-3 h-3 mr-1" />
									Most Popular
								</Badge>
							)}
							<div className="flex flex-col gap-4 h-full">
								<div>
									<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
										{plan.name}
									</Heading>
									<Text size="3" color="gray" className="mb-4 text-gray-11 dark:text-gray-11">
										{plan.description}
									</Text>
									<div className="flex items-baseline gap-2">
										<Heading size="8" weight="bold" className="text-gray-12 dark:text-gray-12">
											{plan.price}
										</Heading>
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{plan.period}
										</Text>
									</div>
								</div>
								<Separator />
								<div className="flex-1 space-y-3">
									{plan.features.map((feature) => (
										<div key={feature} className="flex items-center gap-2">
											<CheckIcon className="w-4 h-4 text-green-11 dark:text-green-10 flex-shrink-0" />
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												{feature}
											</Text>
										</div>
									))}
								</div>
								<Button
									color="blue"
									size="3"
									variant={plan.popular ? "solid" : "soft"}
									className="w-full"
									onClick={() => handlePurchase(plan.name)}
									disabled={loading}
								>
									{loading ? "Processing..." : "Upgrade Now"}
								</Button>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Error Message */}
			{error && (
				<Card size="2" variant="surface" className="p-4 bg-red-a2 border-red-a6">
					<Text size="2" color="red" className="text-red-11">
						{error}
					</Text>
				</Card>
			)}

			{/* Info Card */}
			<Card size="2" variant="surface" className="p-4 bg-blue-a2 dark:bg-blue-a3 border-blue-6 dark:border-blue-5">
				<Text size="2" color="gray" align="center" className="text-gray-11 dark:text-gray-11">
					All plans include a 14-day money-back guarantee. Cancel anytime.
					<br />
					Your subscription is tied to your account and syncs across all devices.
				</Text>
			</Card>
		</div>
	);
}

