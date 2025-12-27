import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization - only create client when needed
function getOpenAIClient() {
	if (!process.env.OPENAI_API_KEY) {
		return null;
	}
	return new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
}

interface GeneratedTask {
	title: string;
	description?: string;
	date: string; // YYYY-MM-DD format
	time?: string; // HH:MM format
	platforms: ("youtube" | "instagram" | "tiktok")[];
	status: "planned" | "scheduled";
}

export async function POST(request: NextRequest) {
	try {
		const openai = getOpenAIClient();
		if (!openai) {
			return NextResponse.json(
				{ error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { prompt, startDate, endDate, postsPerWeek } = body;

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 }
			);
		}

		// Calculate date range
		const start = startDate ? new Date(startDate) : new Date();
		const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
		const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		// Ensure we generate at least the requested number of posts per week
		const weeks = daysDiff / 7;
		const totalPosts = Math.max(Math.ceil(weeks * (postsPerWeek || 1)), postsPerWeek || 1);

		// Create system prompt for calendar generation
		const systemPrompt = `You are an expert content calendar generator. Generate a structured content calendar based on user requirements. 
Return ONLY a valid JSON array of tasks. Each task must have:
- title: string (engaging, specific content title)
- description: string (optional, brief description of the content)
- date: string (YYYY-MM-DD format)
- time: string (optional, HH:MM format in 24-hour format)
- platforms: array of strings (must be one or more of: "youtube", "instagram", "tiktok")
- status: string (must be "planned" or "scheduled")

Distribute posts evenly across the date range. Make titles creative, specific, and relevant to the niche/topic.`;

		const userPrompt = `Generate a content calendar with ${totalPosts} posts from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}. 
Posts per week: ${postsPerWeek || 1}
User request: ${prompt}

Return a JSON array of tasks. Distribute dates evenly. Make each post unique and engaging.`;

		// Call OpenAI API
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.8,
			max_tokens: 2000,
			response_format: { type: "json_object" },
		});

		const responseContent = completion.choices[0]?.message?.content;
		if (!responseContent) {
			throw new Error("No response from AI");
		}

		// Parse the JSON response
		let parsedResponse: { tasks?: GeneratedTask[]; calendar?: GeneratedTask[] } | GeneratedTask[];
		try {
			parsedResponse = JSON.parse(responseContent);
		} catch (e) {
			// If parsing fails, try to extract JSON from the response
			const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				parsedResponse = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error("Invalid JSON response from AI");
			}
		}

		// Extract tasks from response (handle different response formats)
		let tasks: GeneratedTask[] = [];
		if (Array.isArray(parsedResponse)) {
			tasks = parsedResponse;
		} else if (parsedResponse.tasks && Array.isArray(parsedResponse.tasks)) {
			tasks = parsedResponse.tasks;
		} else if (parsedResponse.calendar && Array.isArray(parsedResponse.calendar)) {
			tasks = parsedResponse.calendar;
		}

		// Validate and normalize tasks
		const validatedTasks: GeneratedTask[] = tasks
			.filter((task) => {
				// Basic validation
				return task.title && task.date && Array.isArray(task.platforms) && task.platforms.length > 0;
			})
			.map((task) => {
				// Normalize platforms
				const platforms = task.platforms
					.map((p) => p.toLowerCase())
					.filter((p) => ["youtube", "instagram", "tiktok"].includes(p)) as ("youtube" | "instagram" | "tiktok")[];

				// Ensure at least one platform
				if (platforms.length === 0) {
					platforms.push("tiktok");
				}

				// Validate date format
				const dateMatch = task.date.match(/^\d{4}-\d{2}-\d{2}/);
				if (!dateMatch) {
					// Try to parse and reformat
					const parsedDate = new Date(task.date);
					if (!isNaN(parsedDate.getTime())) {
						task.date = parsedDate.toISOString().split("T")[0];
					} else {
						// Use a default date
						task.date = start.toISOString().split("T")[0];
					}
				}

				// Validate time format if provided
				if (task.time && !task.time.match(/^\d{2}:\d{2}$/)) {
					delete task.time;
				}

				return {
					title: task.title,
					description: task.description || "",
					date: task.date,
					time: task.time,
					platforms: platforms,
					status: (task.status === "scheduled" ? "scheduled" : "planned") as "planned" | "scheduled",
				};
			})
			.slice(0, totalPosts) as GeneratedTask[]; // Limit to requested number

		// If no valid tasks, generate some fallback tasks
		if (validatedTasks.length === 0) {
			const daysBetween = Math.ceil(daysDiff / Math.max(1, totalPosts - 1));
			for (let i = 0; i < totalPosts; i++) {
				const taskDate = new Date(start);
				taskDate.setDate(start.getDate() + i * daysBetween);
				validatedTasks.push({
					title: `${prompt} Content ${i + 1}`,
					description: `Generated content for ${prompt}`,
					date: taskDate.toISOString().split("T")[0],
					platforms: ["tiktok"],
					status: "planned",
				});
			}
		}

		return NextResponse.json({
			success: true,
			tasks: validatedTasks,
		});
	} catch (error) {
		console.error("[Generate Calendar] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to generate calendar" },
			{ status: 500 }
		);
	}
}

