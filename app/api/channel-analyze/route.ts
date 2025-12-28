import { NextResponse } from "next/server";
import OpenAI from "openai";

type RapidEndpoint =
	| "channel_about"
	| "channel_stats"
	| "channel_details"
	| "channel_longs_and_shorts"
	| "channel_main_stats";

const RAPID_HOST = "viewstats.p.rapidapi.com";
const RAPID_BASE = `https://${RAPID_HOST}/v1`;

async function callRapidApi(endpoint: RapidEndpoint, username: string) {
	const key = process.env.RAPIDAPI_KEY;
	if (!key) {
		throw new Error("RAPIDAPI_KEY is not set");
	}

	const url = `${RAPID_BASE}/${endpoint}?username=${encodeURIComponent(username)}`;

	const res = await fetch(url, {
		method: "GET",
		headers: {
			"x-rapidapi-key": key,
			"x-rapidapi-host": RAPID_HOST,
		},
		next: { revalidate: 60 },
	});

	if (res.status === 429) {
		throw new Error("Rate limited by RapidAPI (429). Please try again shortly.");
	}

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`RapidAPI ${endpoint} failed: ${res.status} ${text}`);
	}

	return res.json();
}

function extractUsername(channelUrl: string) {
	try {
		const url = new URL(channelUrl);
		const path = url.pathname;
		// @handle /@username
		const atIndex = path.indexOf("@");
		if (atIndex !== -1) {
			const rest = path.slice(atIndex + 1);
			return rest.split(/[/?]/)[0];
		}
		// handle /c/username
		if (path.includes("/c/")) {
			return path.split("/c/")[1]?.split(/[/?]/)[0];
		}
		// handle plain hostname without path
		return channelUrl;
	} catch {
		// If it's already a username, return as-is
		return channelUrl;
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();
		if (!channelUrl) {
			return NextResponse.json({ error: "channelUrl is required" }, { status: 400 });
		}

		const username = extractUsername(channelUrl);

		// Fetch core data in parallel
		const [about, stats, details, longsAndShorts, mainStats] = await Promise.all([
			callRapidApi("channel_about", username),
			callRapidApi("channel_stats", username),
			callRapidApi("channel_details", username),
			callRapidApi("channel_longs_and_shorts", username),
			callRapidApi("channel_main_stats", username),
		]);

		const openaiKey = process.env.OPENAI_API_KEY;
		if (!openaiKey) {
			return NextResponse.json(
				{
					error: "OPENAI_API_KEY is not set",
					data: { about, stats, details, longsAndShorts, mainStats },
				},
				{ status: 500 },
			);
		}

		const client = new OpenAI({ apiKey: openaiKey });

		const prompt = `
You are an expert YouTube channel analyst. Given the raw channel data, produce concise, actionable insights organized into the sections below. Keep it in plain English, avoid fluff, and highlight the most important signals. 

Sections (in order):
- Channel DNA (niche, sub-niche, positioning, bio/branding language, upload cadence, maturity stage)
- Growth Velocity (how fast and why, breakout periods, formats accelerating growth)
- Viral Mechanics (viral frequency, repeatable patterns, length vs virality, topic/timing combos)
- Engagement Signals (like-to-view, comment velocity, community patterns, audience stickiness)
- Hook & Title Strategy (length patterns, power words, curiosity vs authority, archetypes)
- Thumbnail Language (face vs no-face, emotion, text density, color/contrast, motifs)
- Metadata & SEO (keyword density, topic clustering, tag themes, SEO vs recommendation)
- Publishing Strategy (frequency, day/time, batching, rotation)
- Content Portfolio (evergreen vs trend, short vs long, series vs standalone, risk balance)
- Replication Blueprint (actionable guidance; what to copy, what not, adaptation tips)
- Channel Intelligence Summary (DNA score, strengths, weaknesses, growth ceiling estimate, plain-English summary)

Tab order: Channel DNA | Growth Velocity | Viral Mechanics | Hooks | Thumbnails | Engagement | SEO | Publishing | Portfolio | Blueprint

Return a JSON object with keys matching those tab names, each containing a short summary (2-5 bullets). Keep it concise and specific.

Raw data follows:
- about: ${JSON.stringify(about)}
- stats: ${JSON.stringify(stats)}
- details: ${JSON.stringify(details)}
- longsAndShorts: ${JSON.stringify(longsAndShorts)}
- mainStats: ${JSON.stringify(mainStats)}
`;

		const completion = await client.chat.completions.create({
			model: "gpt-4.1-mini",
			messages: [
				{ role: "system", content: "You are a precise YouTube channel analyst." },
				{ role: "user", content: prompt },
			],
			response_format: { type: "json_object" },
		});

		const content = completion.choices?.[0]?.message?.content || "";
		let analysis = {};
		try {
			analysis = JSON.parse(content);
		} catch {
			analysis = { raw: content };
		}

		return NextResponse.json({
			analysis,
			data: { about, stats, details, longsAndShorts, mainStats },
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

