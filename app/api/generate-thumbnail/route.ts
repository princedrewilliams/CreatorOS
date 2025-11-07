import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request: NextRequest) {
	try {
		// Check if API token is configured
		const apiToken = process.env.REPLICATE_API_TOKEN;
		if (!apiToken) {
			console.error("REPLICATE_API_TOKEN is not set in environment variables");
			return NextResponse.json(
				{ 
					error: "Replicate API token is not configured. Please add REPLICATE_API_TOKEN to your .env.local file." 
				},
				{ status: 500 }
			);
		}

		// Initialize Replicate client with the token
		const replicate = new Replicate({
			auth: apiToken,
		});

		const body = await request.json();
		const { prompt, style, aspectRatio = "16:9" } = body;

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 }
			);
		}

		// Build the enhanced prompt based on style
		const stylePrompts: Record<string, string> = {
			Modern: "modern, clean, contemporary design, professional, sleek, minimalist aesthetic",
			Bold: "bold, high contrast, vibrant colors, eye-catching, dramatic lighting, striking composition",
			Minimalist: "minimalist, simple, elegant, clean lines, lots of white space, subtle colors",
			Gradient: "colorful gradient backgrounds, vibrant hues, smooth color transitions, dynamic",
			Dark: "dark theme, neon accents, cyberpunk aesthetic, moody lighting, dramatic shadows",
			Bright: "bright, vibrant, energetic colors, cheerful, sunny, high saturation, lively",
		};

		const stylePrompt = stylePrompts[style] || stylePrompts.Modern;
		// The prompt from client already includes style instructions, so we use it as-is
		const enhancedPrompt = prompt.includes(stylePrompt) 
			? prompt 
			: `YouTube thumbnail, ${prompt}, ${stylePrompt}, 16:9 aspect ratio, high quality, professional design, text overlay friendly, engaging composition`;

		// Create the prediction
		const input = {
			prompt: enhancedPrompt,
			aspect_ratio: aspectRatio,
			safety_filter_level: "block_medium_and_above",
		};

		const prediction = await replicate.predictions.create({
			model: "google/imagen-4",
			input,
		});

		// Poll for completion
		let completedPrediction = prediction;
		while (
			completedPrediction.status === "starting" ||
			completedPrediction.status === "processing"
		) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			completedPrediction = await replicate.predictions.get(prediction.id);
		}

		if (completedPrediction.status === "succeeded" && completedPrediction.output) {
			// Get the output URL - Replicate returns a URL string or array
			const output = completedPrediction.output;
			let imageUrl: string;

			if (typeof output === "string") {
				imageUrl = output;
			} else if (Array.isArray(output) && output.length > 0) {
				// Handle array output
				const firstOutput = output[0];
				imageUrl = typeof firstOutput === "string" ? firstOutput : (firstOutput as any).url || (firstOutput as any);
			} else if (output && typeof output === "object" && "url" in output) {
				imageUrl = (output as any).url;
			} else {
				throw new Error("Unexpected output format from Replicate");
			}

			return NextResponse.json({
				success: true,
				imageUrl,
				predictionId: prediction.id,
			});
		} else if (completedPrediction.status === "failed") {
			throw new Error(
				`Prediction failed: ${completedPrediction.error || "Unknown error"}`
			);
		} else {
			throw new Error(
				`Prediction did not complete: ${completedPrediction.status}`
			);
		}
	} catch (error) {
		console.error("Error generating thumbnail:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate thumbnail",
			},
			{ status: 500 }
		);
	}
}

