import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import crypto from "crypto";

// Store for video hashes and processing status (in production, use a database)
const videoCache = new Map<string, { clips: any[]; timestamp: number }>();
const processingJobs = new Map<string, { status: string; progress: number; clips?: any[] }>();

export async function POST(request: NextRequest) {
	try {
		const apiToken = process.env.REPLICATE_API_TOKEN;
		if (!apiToken) {
			return NextResponse.json(
				{ error: "Replicate API token is not configured." },
				{ status: 500 }
			);
		}

		const formData = await request.formData();
		const file = formData.get("video") as File;
		const clipCount = parseInt(formData.get("clipCount") as string) || 5;

		if (!file) {
			return NextResponse.json(
				{ error: "Video file is required" },
				{ status: 400 }
			);
		}

		// Validate clip count
		if (clipCount < 5 || clipCount > 10) {
			return NextResponse.json(
				{ error: "Clip count must be between 5 and 10" },
				{ status: 400 }
			);
		}

		// Read file buffer to calculate hash for duplicate detection
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const hash = crypto.createHash("sha256").update(buffer).digest("hex");

		// Check for duplicates
		const cached = videoCache.get(hash);
		if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
			// Return cached clips if less than 24 hours old
			return NextResponse.json({
				success: true,
				jobId: hash,
				clips: cached.clips.slice(0, clipCount),
				cached: true,
			});
		}

		const replicate = new Replicate({
			auth: apiToken,
		});

		// Initialize processing job
		const jobId = hash;
		processingJobs.set(jobId, { status: "uploading", progress: 10 });

		// Convert file to base64 for processing
		const base64 = buffer.toString("base64");
		const dataUrl = `data:${file.type};base64,${base64}`;

		// Step 1: Transcribe video to find engaging moments
		processingJobs.set(jobId, { status: "transcribing", progress: 20 });
		
		// For video transcription, we'll use Whisper
		// Note: In production, you might want to extract audio first
		const transcriptionPrediction = await replicate.predictions.create({
			model: "openai/whisper",
			input: {
				audio: dataUrl,
				language: "en",
				timestamp_granularities: ["word"],
			},
		});

		// Poll for transcription completion
		let transcriptionResult = transcriptionPrediction;
		while (
			transcriptionResult.status === "starting" ||
			transcriptionResult.status === "processing"
		) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			transcriptionResult = await replicate.predictions.get(transcriptionPrediction.id);
			const progress = Math.min(20 + (transcriptionResult.status === "processing" ? 30 : 0), 50);
			processingJobs.set(jobId, { status: "transcribing", progress });
		}

		if (transcriptionResult.status !== "succeeded") {
			processingJobs.set(jobId, { status: "failed", progress: 0 });
			return NextResponse.json(
				{ error: "Failed to transcribe video" },
				{ status: 500 }
			);
		}

		// Step 2: Analyze transcription for engaging moments
		processingJobs.set(jobId, { status: "analyzing", progress: 60 });
		
		// Extract transcription data
		const transcription = transcriptionResult.output;
		const segments = transcription?.segments || [];
		
		// Estimate video duration (in seconds)
		const videoDuration = segments.length > 0 
			? Math.max(...segments.map((s: any) => s.end || 0))
			: 60; // Default to 60 seconds if no segments

		// Step 3: Generate clips based on high-energy moments
		// In a real implementation, you'd analyze:
		// - Audio energy/volume spikes
		// - Speech rate changes
		// - Keyword detection (excitement words)
		// - Visual scene changes
		
		processingJobs.set(jobId, { status: "generating", progress: 70 });
		
		const clips: any[] = [];
		const clipDuration = 15; // 15 seconds per clip
		
		// Find engaging moments based on transcription segments
		// Prioritize segments with:
		// - Higher word count (more activity)
		// - Specific keywords (excitement, questions, etc.)
		// - Longer segments (more content)
		
		const engagingMoments = segments
			.map((segment: any, index: number) => ({
				start: segment.start || 0,
				end: segment.end || segment.start + 5,
				text: segment.text || "",
				score: calculateEngagementScore(segment),
				index,
			}))
			.sort((a: any, b: any) => b.score - a.score)
			.slice(0, clipCount * 2); // Get more candidates than needed

		// Generate clips from top engaging moments
		for (let i = 0; i < Math.min(clipCount, engagingMoments.length); i++) {
			const moment = engagingMoments[i];
			const startTime = Math.max(0, moment.start - 2); // Start 2 seconds before
			const endTime = Math.min(videoDuration, moment.end + clipDuration - (moment.end - moment.start));

			clips.push({
				id: `${jobId}-${i}`,
				startTime,
				endTime,
				score: moment.score,
				text: moment.text.substring(0, 100), // Preview text
				thumbnail: null, // Would be generated from video frame
				// In production, you'd generate actual clip URLs here
				// For now, we'll return metadata that the frontend can use
				downloadUrl: `/api/download-clip?jobId=${jobId}&clipIndex=${i}&start=${startTime}&end=${endTime}`,
			});
		}

		// Sort by engagement score
		clips.sort((a, b) => b.score - a.score);
		clips.slice(0, clipCount);

		// Cache the results
		videoCache.set(hash, { clips, timestamp: Date.now() });
		processingJobs.set(jobId, { status: "completed", progress: 100, clips });

		return NextResponse.json({
			success: true,
			jobId,
			clips,
			cached: false,
		});
	} catch (error) {
		console.error("[Generate Clips] Error:", error);
		processingJobs.set(crypto.createHash("sha256").update(Date.now().toString()).digest("hex"), { 
			status: "failed", 
			progress: 0 
		});
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to process video" },
			{ status: 500 }
		);
	}
}

// Helper function to calculate engagement score
function calculateEngagementScore(segment: any): number {
	let score = 0.5; // Base score

	// Increase score for longer segments (more content)
	if (segment.end && segment.start) {
		const duration = segment.end - segment.start;
		score += Math.min(duration / 10, 0.2); // Up to 0.2 for longer segments
	}

	// Increase score for more words (more activity)
	if (segment.text) {
		const wordCount = segment.text.split(/\s+/).length;
		score += Math.min(wordCount / 20, 0.2); // Up to 0.2 for more words
	}

	// Increase score for excitement keywords
	const excitementKeywords = [
		"wow", "amazing", "incredible", "unbelievable", "awesome",
		"check this out", "look at this", "you won't believe",
		"wait until", "this is", "here's", "watch this"
	];
	if (segment.text) {
		const lowerText = segment.text.toLowerCase();
		const keywordMatches = excitementKeywords.filter(kw => lowerText.includes(kw)).length;
		score += Math.min(keywordMatches * 0.1, 0.3); // Up to 0.3 for keywords
	}

	// Increase score for questions (engagement)
	if (segment.text && /[?]/.test(segment.text)) {
		score += 0.1;
	}

	return Math.min(score, 1.0); // Cap at 1.0
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const jobId = searchParams.get("jobId");

	if (!jobId) {
		return NextResponse.json(
			{ error: "Job ID is required" },
			{ status: 400 }
		);
	}

	const job = processingJobs.get(jobId);
	if (!job) {
		return NextResponse.json(
			{ error: "Job not found" },
			{ status: 404 }
		);
	}

	return NextResponse.json({
		status: job.status,
		progress: job.progress,
		clips: job.clips || null,
	});
}
