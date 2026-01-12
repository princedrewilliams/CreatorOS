// Shared OpenAI Client for Learning Lab

import OpenAI from "openai";

let clientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) return null;

	if (!clientInstance) {
		clientInstance = new OpenAI({ apiKey });
	}
	return clientInstance;
}

export async function analyzeWithLLM<T>(
	systemPrompt: string,
	userPrompt: string,
	model = "gpt-4.1-mini"
): Promise<T | null> {
	const client = getOpenAIClient();
	if (!client) return null;

	try {
		const completion = await client.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			response_format: { type: "json_object" },
		});

		const content = completion.choices?.[0]?.message?.content || "{}";
		return JSON.parse(content) as T;
	} catch (err) {
		console.error("LLM analysis failed:", err);
		return null;
	}
}

export async function analyzeWithVision<T>(
	systemPrompt: string,
	userPrompt: string,
	imageUrl: string,
	model = "gpt-4o"
): Promise<T | null> {
	const client = getOpenAIClient();
	if (!client) return null;

	try {
		const completion = await client.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: systemPrompt },
				{
					role: "user",
					content: [
						{ type: "text", text: userPrompt },
						{ type: "image_url", image_url: { url: imageUrl } },
					],
				},
			],
			response_format: { type: "json_object" },
		});

		const content = completion.choices?.[0]?.message?.content || "{}";
		return JSON.parse(content) as T;
	} catch (err) {
		console.error("Vision analysis failed:", err);
		return null;
	}
}
