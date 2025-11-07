"use client";

import { Heading, Text, Card, Button, Badge, Separator, Table } from "@whop/react/components";
import { ArrowLeftIcon, PlusIcon, FileTextIcon, SymbolIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const deals = [
	{
		id: 1,
		brand: "TechCorp",
		amount: "$5,000",
		status: "active",
		deadline: "2024-11-15",
		type: "Video Sponsorship",
	},
	{
		id: 2,
		brand: "BrandX",
		amount: "$2,500",
		status: "pending",
		deadline: "2024-11-20",
		type: "Product Placement",
	},
	{
		id: 3,
		brand: "StartupY",
		amount: "$8,000",
		status: "completed",
		deadline: "2024-11-05",
		type: "Multiple Videos",
	},
];

export default function SponsorsPage() {
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
						Sponsor Management
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Track deals, revenue, and invoices
					</Text>
				</div>
				<Button color="green" size="3" variant="solid">
					<PlusIcon className="mr-2" />
					New Deal
				</Button>
			</div>

			{/* Revenue Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-green-a2 dark:bg-green-a3 flex items-center justify-center">
							<SymbolIcon className="w-6 h-6 text-green-11 dark:text-green-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Total Revenue
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								$15,500
							</Heading>
						</div>
					</div>
				</Card>
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center">
							<FileTextIcon className="w-6 h-6 text-blue-11 dark:text-blue-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Active Deals
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								2
							</Heading>
						</div>
					</div>
				</Card>
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg bg-amber-a2 dark:bg-amber-a3 flex items-center justify-center">
							<SymbolIcon className="w-6 h-6 text-amber-11 dark:text-amber-10" />
						</div>
						<div>
							<Text size="2" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
								Pending
							</Text>
							<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
								$2,500
							</Heading>
						</div>
					</div>
				</Card>
			</div>

			{/* Deals Table */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Deals & Invoices
				</Heading>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-a4 dark:border-gray-a6">
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray" className="text-gray-11 dark:text-gray-11">
										Brand
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Type
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Amount
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Status
									</Text>
								</th>
								<th className="text-left py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Deadline
									</Text>
								</th>
								<th className="text-right py-3 px-4">
									<Text size="2" weight="bold" color="gray">
										Actions
									</Text>
								</th>
							</tr>
						</thead>
						<tbody>
							{deals.map((deal, index) => (
								<motion.tr
									key={deal.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="border-b border-gray-a4 dark:border-gray-a6 hover:bg-gray-a2 dark:hover:bg-gray-a3 transition-colors"
								>
									<td className="py-3 px-4">
										<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
											{deal.brand}
										</Text>
									</td>
									<td className="py-3 px-4">
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{deal.type}
										</Text>
									</td>
									<td className="py-3 px-4">
										<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
											{deal.amount}
										</Text>
									</td>
									<td className="py-3 px-4">
										<Badge
											color={
												deal.status === "active"
													? "green"
													: deal.status === "pending"
														? "amber"
														: "gray"
											}
											size="1"
											variant="soft"
										>
											{deal.status}
										</Badge>
									</td>
									<td className="py-3 px-4">
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{deal.deadline}
										</Text>
									</td>
									<td className="py-3 px-4 text-right">
										<Button variant="ghost" size="1">
											View
										</Button>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
}

