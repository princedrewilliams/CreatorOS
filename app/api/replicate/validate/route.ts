// Validate upload against replication constraints

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReplicationSettingsById } from "@/lib/user-data";
import { validateUpload } from "@/lib/replicate/validate-constraints";
import type { UploadDraft } from "@/lib/replicate/types";

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { settingsId, upload } = body;

		if (!settingsId) {
			return NextResponse.json(
				{ error: "settingsId is required" },
				{ status: 400 }
			);
		}

		if (!upload || typeof upload.title !== "string") {
			return NextResponse.json(
				{ error: "upload with title, description, and tags is required" },
				{ status: 400 }
			);
		}

		// Get replication settings
		const settings = getReplicationSettingsById(user.whop_user_id, settingsId);

		if (!settings) {
			return NextResponse.json(
				{ error: "Replication settings not found" },
				{ status: 404 }
			);
		}

		// Prepare upload draft
		const uploadDraft: UploadDraft = {
			title: upload.title || "",
			description: upload.description || "",
			tags: Array.isArray(upload.tags) ? upload.tags : [],
		};

		// Validate against constraints
		const result = validateUpload(uploadDraft, settings.constraints);

		return NextResponse.json({
			valid: result.valid,
			violations: result.violations,
			score: result.score,
			constraints: settings.constraints,
		});
	} catch (error) {
		console.error("[Replicate Validate] Error:", error);
		return NextResponse.json(
			{ error: "Validation failed" },
			{ status: 500 }
		);
	}
}
