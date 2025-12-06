import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

// Configure route for longer execution time (video processing)
export const maxDuration = 300; // 5 minutes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Store for video file paths (in production, use cloud storage or database)
// For now, we'll use a simple in-memory map (shared across requests in same process)
// In production, store paths in a database or use absolute paths
const videoStorage = new Map<string, string>();

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const jobId = searchParams.get("jobId");
		const clipIndex = searchParams.get("clipIndex");
		const start = parseFloat(searchParams.get("start") || "0");
		const end = parseFloat(searchParams.get("end") || "15");

		if (!jobId || clipIndex === null) {
			return NextResponse.json(
				{ error: "Job ID and clip index are required" },
				{ status: 400 }
			);
		}

		// Get the original video path from storage
		// Use /tmp directory for Vercel serverless functions
		const tmpVideosDir = process.env.VERCEL ? "/tmp/videos" : path.join(process.cwd(), "tmp", "videos");
		let originalVideoPath = videoStorage.get(jobId);
		
		// If not in memory, try to find by jobId pattern in tmp/videos
		if (!originalVideoPath || !existsSync(originalVideoPath)) {
			if (existsSync(tmpVideosDir)) {
				const fs = await import("fs/promises");
				const files = await fs.readdir(tmpVideosDir);
				const matchingFile = files.find(f => f.startsWith(jobId));
				if (matchingFile) {
					originalVideoPath = path.join(tmpVideosDir, matchingFile);
				}
			}
		}
		
		if (!originalVideoPath || !existsSync(originalVideoPath)) {
			return NextResponse.json(
				{ error: "Original video not found. Please re-upload the video." },
				{ status: 404 }
			);
		}

		// Create clips directory if it doesn't exist
		// Use /tmp directory for Vercel serverless functions
		const clipsDir = process.env.VERCEL ? "/tmp/clips" : path.join(process.cwd(), "tmp", "clips");
		if (!existsSync(clipsDir)) {
			await mkdir(clipsDir, { recursive: true });
		}

		// Generate clip filename
		const clipFilename = `${jobId}-${clipIndex}-${start}-${end}.mp4`;
		const clipPath = path.join(clipsDir, clipFilename);

		// Check if clip already exists
		if (existsSync(clipPath)) {
			const clipBuffer = await readFile(clipPath);
			return new NextResponse(clipBuffer as any, {
				headers: {
					"Content-Type": "video/mp4",
					"Content-Disposition": `attachment; filename="${clipFilename}"`,
					"Content-Length": clipBuffer.length.toString(),
				},
			});
		}

		// Calculate duration
		const duration = end - start;

		// Extract clip using FFmpeg
		// Note: On Vercel, FFmpeg needs to be available in the PATH or use a custom binary
		// For production, consider using a video processing service or Lambda with FFmpeg layer
		const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
		const ffmpegCommand = `${ffmpegPath} -i "${originalVideoPath}" -ss ${start} -t ${duration} -c:v libx264 -c:a aac -preset fast -crf 22 -avoid_negative_ts make_zero -y "${clipPath}"`;

		try {
			await execAsync(ffmpegCommand);
		} catch (error) {
			console.error("[Download Clip] FFmpeg error:", error);
			return NextResponse.json(
				{ 
					error: "Failed to extract clip. FFmpeg may not be available in this environment. For production, consider using a video processing service.",
					details: process.env.VERCEL ? "Vercel serverless functions require FFmpeg to be bundled or use an external service." : "Please ensure FFmpeg is installed and accessible."
				},
				{ status: 500 }
			);
		}

		// Check if clip was created
		if (!existsSync(clipPath)) {
			return NextResponse.json(
				{ error: "Failed to create clip file" },
				{ status: 500 }
			);
		}

		// Read and return the clip
		const clipBuffer = await readFile(clipPath);
		
		// Clean up after sending (optional - you might want to keep clips for a while)
		// setTimeout(() => unlink(clipPath).catch(console.error), 60000); // Delete after 1 minute

		return new NextResponse(clipBuffer as any, {
			headers: {
				"Content-Type": "video/mp4",
				"Content-Disposition": `attachment; filename="${clipFilename}"`,
				"Content-Length": clipBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("[Download Clip] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to generate clip" },
			{ status: 500 }
		);
	}
}

