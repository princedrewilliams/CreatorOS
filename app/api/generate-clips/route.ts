import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Transcription service type
type TranscriptionService = "replicate" | "assemblyai";

// Configure route for larger requests and longer execution time
export const maxDuration = 300; // 5 minutes (Vercel Pro plan limit)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Store for video hashes and processing status (in production, use a database)
const videoCache = new Map<string, { clips: any[]; timestamp: number }>();
const processingJobs = new Map<string, { status: string; progress: number; clips?: any[] }>();
const videoStorage = new Map<string, string>(); // Store original video paths

// Add CORS headers helper
function corsHeaders() {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: corsHeaders(),
	});
}

export async function POST(request: NextRequest) {
	try {
		// Check if at least one transcription service is configured
		const hasAssemblyAI = Boolean(process.env.ASSEMBLYAI_API_KEY);
		const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN);
		
		if (!hasAssemblyAI && !hasReplicate) {
			return NextResponse.json(
				{ 
					error: "No transcription service configured",
					details: "Please configure either ASSEMBLYAI_API_KEY or REPLICATE_API_TOKEN in your environment variables.",
					suggestion: "We recommend AssemblyAI for better free tier limits (5 hours/month). Get your API key at https://www.assemblyai.com/"
				},
				{ status: 500, headers: corsHeaders() }
			);
		}

		const formData = await request.formData();
		const file = formData.get("video") as File;
		const clipCount = parseInt(formData.get("clipCount") as string) || 5;

		// Check file size (Vercel has limits: 4.5MB for Hobby, 50MB for Pro)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: `File size exceeds limit. Maximum size is ${maxSize / 1024 / 1024}MB.` },
				{ status: 413, headers: corsHeaders() }
			);
		}

		if (!file) {
			return NextResponse.json(
				{ error: "Video file is required" },
				{ status: 400, headers: corsHeaders() }
			);
		}

		// Validate clip count
		if (clipCount < 5 || clipCount > 10) {
			return NextResponse.json(
				{ error: "Clip count must be between 5 and 10" },
				{ status: 400, headers: corsHeaders() }
			);
		}

		// Read file buffer to calculate hash for duplicate detection
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const hash = crypto.createHash("sha256").update(buffer).digest("hex");

		// Save video file to temporary storage for FFmpeg processing
		// Use /tmp directory for Vercel serverless functions (writable filesystem)
		const tmpDir = process.env.VERCEL ? "/tmp/videos" : path.join(process.cwd(), "tmp", "videos");
		if (!existsSync(tmpDir)) {
			await mkdir(tmpDir, { recursive: true });
		}
		const videoPath = path.join(tmpDir, `${hash}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`);
		await writeFile(videoPath, buffer);
		videoStorage.set(hash, videoPath);

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

		// Initialize processing job
		const jobId = hash;
		processingJobs.set(jobId, { status: "uploading", progress: 10 });

		// Check if Replicate API token is available (only needed if AssemblyAI is not used)
		const replicateApiToken = process.env.REPLICATE_API_TOKEN;
		let replicate: Replicate | null = null;
		if (replicateApiToken) {
			replicate = new Replicate({
				auth: replicateApiToken,
			});
		}

		// Step 1: Transcribe video to find engaging moments
		processingJobs.set(jobId, { status: "transcribing", progress: 20 });
		
		// Choose transcription service (AssemblyAI has better free tier, Replicate for fallback)
		let useAssemblyAI = Boolean(process.env.ASSEMBLYAI_API_KEY && !process.env.FORCE_REPLICATE);
		
		let transcriptionData: any;
		
		if (useAssemblyAI) {
			// Use AssemblyAI for transcription (better free tier, no rate limits)
			try {
				console.log("[Generate Clips] Using AssemblyAI for transcription");
				transcriptionData = await transcribeWithAssemblyAI(buffer, file.type, (progress) => {
					processingJobs.set(jobId, { status: "transcribing", progress: 20 + Math.floor(progress * 0.3) });
				});
			} catch (assemblyError: any) {
				console.error("[Generate Clips] AssemblyAI failed, falling back to Replicate:", assemblyError);
				// Fall back to Replicate if AssemblyAI fails
				useAssemblyAI = false;
			}
		}
		
		if (!useAssemblyAI) {
			// Use Replicate for transcription (with retry logic for rate limiting)
			if (!replicate) {
				return NextResponse.json(
					{ 
						error: "No transcription service available. Please configure either ASSEMBLYAI_API_KEY or REPLICATE_API_TOKEN in your environment variables.",
						details: "AssemblyAI is recommended for better free tier limits (5 hours/month)."
					},
					{ status: 500, headers: corsHeaders() }
				);
			}

			console.log("[Generate Clips] Using Replicate for transcription");
			
			// Upload video to a temporary URL first (Replicate models may not accept base64 data URLs)
			// For now, we'll try using the file directly or a data URL
			// Note: Some Replicate models require the audio to be uploaded to a URL first
			
			// Retry helper function with exponential backoff
			const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) => {
				for (let attempt = 0; attempt < maxRetries; attempt++) {
					try {
						return await fn();
					} catch (error: any) {
						const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit");
						
						if (isRateLimit && attempt < maxRetries - 1) {
							// Extract retry_after from error if available
							const retryAfter = error?.retry_after || error?.detail?.match(/resets in ~(\d+)s/)?.[1] || baseDelay / 1000;
							const delay = Math.min(retryAfter * 1000, 60000); // Max 60 seconds
							console.log(`[Generate Clips] Rate limited. Retrying after ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
							await new Promise(resolve => setTimeout(resolve, delay));
							continue;
						}
						throw error;
					}
				}
			};
			
			// Try different model configurations
			const whisperModels = [
				{ name: "openai/whisper-large-v3", useFile: false },
				{ name: "fofr/whisper-large-v3", useFile: false },
				{ name: "vaibhavs10/incredibly-fast-whisper", useFile: false },
			];
			
			let transcriptionPrediction;
			let lastError: Error | null = null;
			
			for (const modelConfig of whisperModels) {
				try {
					console.log(`[Generate Clips] Trying Whisper model: ${modelConfig.name}`);
					
					// Convert file to base64 for processing
					const base64 = buffer.toString("base64");
					const dataUrl = `data:${file.type};base64,${base64}`;
					
					transcriptionPrediction = await retryWithBackoff(async () => {
						const input: any = {
							language: "en",
						};
						
						// Try different input formats based on model
						if (modelConfig.name.includes("whisper-large-v3")) {
							input.audio = dataUrl;
							input.timestamp_granularities = ["word"];
						} else {
							// For incredibly-fast-whisper, try file path or data URL
							input.audio = dataUrl;
						}
						
						return await replicate!.predictions.create({
							model: modelConfig.name,
							input: input,
						});
					});
					
					console.log(`[Generate Clips] Successfully started transcription with model: ${modelConfig.name}`);
					break; // Success, exit loop
				} catch (error: any) {
					const errorDetails = error?.response?.data || error?.message || String(error);
					console.error(`[Generate Clips] Model ${modelConfig.name} failed:`, errorDetails);
					
					// Store more detailed error information
					if (!lastError) {
						lastError = new Error(`Model ${modelConfig.name}: ${errorDetails}`);
					} else {
						lastError = new Error(`${lastError.message}; ${modelConfig.name}: ${errorDetails}`);
					}
					
					// If it's a rate limit error, wait before trying next model
					if (error?.status === 429 || error?.message?.includes("429")) {
						const retryAfter = error?.retry_after || 10;
						console.log(`[Generate Clips] Rate limited. Waiting ${retryAfter}s before trying next model...`);
						await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
					}
					continue; // Try next model
				}
			}
			
			if (!transcriptionPrediction) {
				const errorMessage = lastError?.message || "All Whisper models failed";
				console.error("[Generate Clips] All transcription attempts failed:", errorMessage);
				
				return NextResponse.json(
					{ 
						error: errorMessage.includes("rate limit") || errorMessage.includes("429")
							? "Rate limit exceeded. Please add ASSEMBLYAI_API_KEY to your environment variables for better free tier limits (5 hours/month), or add a payment method to your Replicate account."
							: errorMessage.includes("404") || errorMessage.includes("Not Found")
							? "Transcription model not found. Please check your Replicate API token and model availability."
							: "Failed to transcribe video. Please check Replicate API and model availability, or configure ASSEMBLYAI_API_KEY for a more reliable service.",
						details: errorMessage,
						suggestion: "We recommend using AssemblyAI (free tier: 5 hours/month). Add ASSEMBLYAI_API_KEY to your environment variables."
					},
					{ status: 500, headers: corsHeaders() }
				);
			}

			// Poll for transcription completion
			let transcriptionResult = transcriptionPrediction;
			let pollAttempts = 0;
			const maxPollAttempts = 150; // 5 minutes max (150 * 2 seconds)
			
			while (
				transcriptionResult.status === "starting" ||
				transcriptionResult.status === "processing"
			) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
				transcriptionResult = await replicate!.predictions.get(transcriptionPrediction.id);
				const progress = Math.min(20 + (transcriptionResult.status === "processing" ? 30 : 0), 50);
				processingJobs.set(jobId, { status: "transcribing", progress });
				
				pollAttempts++;
				if (pollAttempts >= maxPollAttempts) {
					processingJobs.set(jobId, { status: "failed", progress: 0 });
					return NextResponse.json(
						{ 
							error: "Transcription timeout. The video may be too long or the service is taking too long to process.",
							details: `Polled for ${pollAttempts * 2} seconds without completion. Status: ${transcriptionResult.status}`
						},
						{ status: 500, headers: corsHeaders() }
					);
				}
			}

			if (transcriptionResult.status !== "succeeded") {
				processingJobs.set(jobId, { status: "failed", progress: 0 });
				const errorDetails = transcriptionResult.error || transcriptionResult.status;
				console.error("[Generate Clips] Transcription failed:", errorDetails);
				
				return NextResponse.json(
					{ 
						error: "Failed to transcribe video",
						details: errorDetails,
						status: transcriptionResult.status,
						suggestion: "Try using AssemblyAI instead by adding ASSEMBLYAI_API_KEY to your environment variables."
					},
					{ status: 500, headers: corsHeaders() }
				);
			}

			transcriptionData = transcriptionResult.output;
			
			// Validate transcription data
			if (!transcriptionData || (!transcriptionData.segments && !transcriptionData.text && !transcriptionData.words)) {
				console.error("[Generate Clips] Invalid transcription data:", transcriptionData);
				return NextResponse.json(
					{ 
						error: "Transcription completed but returned invalid data format",
						details: "The transcription service returned data in an unexpected format.",
						suggestion: "Try using AssemblyAI instead by adding ASSEMBLYAI_API_KEY to your environment variables."
					},
					{ status: 500, headers: corsHeaders() }
				);
			}
		}

		// Validate transcription data exists
		if (!transcriptionData) {
			processingJobs.set(jobId, { status: "failed", progress: 0 });
			return NextResponse.json(
				{ 
					error: "Transcription data is missing",
					details: "The transcription service did not return any data.",
					suggestion: "Try using AssemblyAI instead by adding ASSEMBLYAI_API_KEY to your environment variables."
				},
				{ status: 500, headers: corsHeaders() }
			);
		}

		// Step 2: Analyze transcription for engaging moments
		processingJobs.set(jobId, { status: "analyzing", progress: 60 });
		
		// Extract transcription data (normalize format from different services)
		let segments: any[] = [];
		if (transcriptionData.words && Array.isArray(transcriptionData.words)) {
			// AssemblyAI format: words array with start/end times
			segments = groupWordsIntoSegments(transcriptionData.words);
		} else if (transcriptionData.segments && Array.isArray(transcriptionData.segments)) {
			// Replicate/Whisper format: segments array
			segments = transcriptionData.segments;
		} else if (transcriptionData.text) {
			// Fallback: single segment with full text
			segments = [{
				start: 0,
				end: 60, // Estimate
				text: transcriptionData.text,
			}];
		} else {
			// No valid transcription data found
			console.error("[Generate Clips] No valid segments found in transcription data:", transcriptionData);
			processingJobs.set(jobId, { status: "failed", progress: 0 });
			return NextResponse.json(
				{ 
					error: "Could not extract transcription segments",
					details: "The transcription service returned data but it could not be parsed into segments.",
					rawData: transcriptionData,
					suggestion: "Try using AssemblyAI instead by adding ASSEMBLYAI_API_KEY to your environment variables."
				},
				{ status: 500, headers: corsHeaders() }
			);
		}
		
		// Validate we have segments
		if (segments.length === 0) {
			processingJobs.set(jobId, { status: "failed", progress: 0 });
			return NextResponse.json(
				{ 
					error: "No transcription segments found",
					details: "The video may not contain any speech or the transcription failed to identify segments.",
					suggestion: "Ensure your video contains audio with speech."
				},
				{ status: 500, headers: corsHeaders() }
			);
		}
		
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
		}, {
			headers: corsHeaders(),
		});
	} catch (error) {
		console.error("[Generate Clips] Error:", error);
		const errorHash = crypto.createHash("sha256").update(Date.now().toString()).digest("hex");
		processingJobs.set(errorHash, { 
			status: "failed", 
			progress: 0 
		});
		return NextResponse.json(
			{ 
				error: error instanceof Error ? error.message : "Failed to process video",
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500, headers: corsHeaders() }
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

// Helper function to transcribe with AssemblyAI
async function transcribeWithAssemblyAI(
	videoBuffer: Buffer, 
	mimeType: string,
	onProgress?: (progress: number) => void
): Promise<any> {
	const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
	if (!assemblyApiKey) {
		throw new Error("ASSEMBLYAI_API_KEY is not configured");
	}

	// Step 1: Upload video to AssemblyAI
	if (onProgress) onProgress(10);
	const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
		method: "POST",
		headers: {
			authorization: assemblyApiKey,
		},
		body: videoBuffer as any, // Buffer is compatible with fetch in Node.js
	});

	if (!uploadResponse.ok) {
		const errorText = await uploadResponse.text();
		throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} - ${errorText}`);
	}

	const { upload_url } = await uploadResponse.json();
	if (onProgress) onProgress(30);

	// Step 2: Start transcription
	const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
		method: "POST",
		headers: {
			authorization: assemblyApiKey,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			audio_url: upload_url,
			word_timestamps: true,
			punctuate: true,
			format_text: true,
		}),
	});

	if (!transcriptResponse.ok) {
		const errorText = await transcriptResponse.text();
		throw new Error(`AssemblyAI transcription failed: ${transcriptResponse.status} - ${errorText}`);
	}

	const { id } = await transcriptResponse.json();
	if (onProgress) onProgress(50);

	// Step 3: Poll for completion
	let transcript;
	let attempts = 0;
	const maxAttempts = 60; // 3 minutes max (60 * 3 seconds)

	do {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
			headers: { authorization: assemblyApiKey },
		});

		if (!statusResponse.ok) {
			throw new Error(`Failed to check transcription status: ${statusResponse.status}`);
		}

		transcript = await statusResponse.json();
		attempts++;

		if (transcript.status === "error") {
			throw new Error(`Transcription failed: ${transcript.error}`);
		}

		if (attempts >= maxAttempts) {
			throw new Error("Transcription timeout");
		}

		// Update progress (50-100%)
		if (onProgress) {
			const progress = 50 + Math.floor((attempts / maxAttempts) * 50);
			onProgress(progress);
		}
	} while (transcript.status !== "completed");

	// Return in format compatible with existing code
	return {
		words: transcript.words || [],
		text: transcript.text || "",
	};
}

// Helper function to group AssemblyAI words into segments
function groupWordsIntoSegments(words: any[]): any[] {
	if (!words || words.length === 0) return [];

	const segments: any[] = [];
	let currentSegment: any = null;
	const maxSegmentDuration = 10; // Max 10 seconds per segment

	for (const word of words) {
		const wordStart = word.start / 1000; // Convert ms to seconds
		const wordEnd = word.end / 1000;

		if (!currentSegment || wordStart >= currentSegment.end || (wordEnd - currentSegment.start) > maxSegmentDuration) {
			// Start new segment
			if (currentSegment) {
				segments.push(currentSegment);
			}
			currentSegment = {
				start: wordStart,
				end: wordEnd,
				text: word.text || "",
			};
		} else {
			// Add to current segment
			currentSegment.end = wordEnd;
			currentSegment.text += " " + (word.text || "");
		}
	}

	if (currentSegment) {
		segments.push(currentSegment);
	}

	return segments;
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const jobId = searchParams.get("jobId");

		if (!jobId) {
			return NextResponse.json(
				{ error: "Job ID is required" },
				{ status: 400, headers: corsHeaders() }
			);
		}

		const job = processingJobs.get(jobId);
		if (!job) {
			return NextResponse.json(
				{ error: "Job not found" },
				{ status: 404, headers: corsHeaders() }
			);
		}

	return NextResponse.json({
		status: job.status,
		progress: job.progress,
		clips: job.clips || null,
	}, {
		headers: corsHeaders(),
	});
}
