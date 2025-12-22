"use client";

import { Heading, Text, Card, Table } from "@whop/react/components";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface Metric {
	metric: string;
	whatItMeasures: string;
	whyImportant: string;
}

const metrics: Metric[] = [
	{
		metric: "Views",
		whatItMeasures: "Total number of times your video has been watched",
		whyImportant: "Quick snapshot of reach, but should be paired with deeper metrics",
	},
	{
		metric: "Watch Time",
		whatItMeasures: "Total minutes viewers spend watching your videos",
		whyImportant: "Directly impacts YouTube's recommendation system",
	},
	{
		metric: "Average View Duration (AVD)",
		whatItMeasures: "Average length of time viewers watch per view",
		whyImportant: "Helps improve content pacing and overall engagement",
	},
	{
		metric: "Audience Retention",
		whatItMeasures: "Percentage of viewers who keep watching over time",
		whyImportant: "Identifies drop-off points to optimize intros and storytelling",
	},
	{
		metric: "CTR (Click-Through Rate)",
		whatItMeasures: "% of people who clicked after seeing your thumbnail/title",
		whyImportant: "Strong indicator of packaging effectiveness",
	},
	{
		metric: "Traffic Sources",
		whatItMeasures: "Where viewers found your video (search, suggested, external)",
		whyImportant: "Reveals discovery opportunities",
	},
	{
		metric: "Subscriber Growth",
		whatItMeasures: "Net new subscribers gained or lost per video",
		whyImportant: "Shows which content builds loyalty",
	},
	{
		metric: "Engagement (Likes, Comments, Shares)",
		whatItMeasures: "How viewers interact with your content",
		whyImportant: "Signals to YouTube that content is valuable",
	},
];

export function MetricsGuide() {
	return (
		<Card size="3" variant="surface" className="p-6">
			<div className="flex items-center gap-2 mb-4">
				<InfoCircledIcon className="w-5 h-5 text-blue-11" />
				<Heading size="5">YouTube Analytics Metrics Guide</Heading>
			</div>
			<Text size="2" color="gray" className="mb-6">
				Understanding what each metric means and why it matters for your channel growth
			</Text>
			
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-gray-a6">
							<th className="text-left p-3 font-semibold text-gray-12">Metric</th>
							<th className="text-left p-3 font-semibold text-gray-12">What It Measures</th>
							<th className="text-left p-3 font-semibold text-gray-12">Why It's Important</th>
						</tr>
					</thead>
					<tbody>
						{metrics.map((metric, index) => (
							<tr key={index} className="border-b border-gray-a4 hover:bg-gray-a2 transition-colors">
								<td className="p-3 font-medium text-gray-12">{metric.metric}</td>
								<td className="p-3 text-gray-11">{metric.whatItMeasures}</td>
								<td className="p-3 text-gray-11">{metric.whyImportant}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

