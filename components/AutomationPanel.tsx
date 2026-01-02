"use client";

import { Card, Button, Text, Heading } from "@whop/react/components";
import { LightningBoltIcon, CheckIcon } from "@radix-ui/react-icons";

interface AutomationFeature {
	id: string;
	title: string;
	description: string;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	loading?: boolean;
}

interface AutomationPanelProps {
	title: string;
	features: AutomationFeature[];
}

export function AutomationPanel({ title, features }: AutomationPanelProps) {
	return (
		<Card size="3" variant="surface" className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<LightningBoltIcon className="w-5 h-5 text-purple-9" />
				<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
					{title}
				</Heading>
			</div>
			<div className="space-y-3">
				{features.map((feature) => (
					<Card
						key={feature.id}
						size="2"
						variant="surface"
						className="p-4 flex items-center justify-between"
					>
						<div className="flex-1">
							<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
								{feature.title}
							</Text>
							<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
								{feature.description}
							</Text>
						</div>
						<Button
							variant={feature.enabled ? "soft" : "ghost"}
							color={feature.enabled ? "green" : "gray"}
							size="2"
							onClick={() => feature.onToggle(!feature.enabled)}
							disabled={feature.loading}
						>
							{feature.enabled ? (
								<>
									<CheckIcon className="mr-2" />
									Enabled
								</>
							) : (
								"Enable"
							)}
						</Button>
					</Card>
				))}
			</div>
		</Card>
	);
}

