"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

interface ChannelNotesModalProps {
	isOpen: boolean;
	onClose: () => void;
	channelId: string;
	channelName: string;
	initialNotes?: string;
	onSave?: (notes: string) => void;
}

export function ChannelNotesModal({
	isOpen,
	onClose,
	channelId,
	channelName,
	initialNotes = "",
	onSave,
}: ChannelNotesModalProps) {
	const [notes, setNotes] = useState(initialNotes);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setNotes(initialNotes);
	}, [initialNotes, isOpen]);

	if (!isOpen) return null;

	const handleSave = async () => {
		setSaving(true);

		try {
			const res = await fetch("/api/saved-channels", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelId, notes }),
			});

			if (res.ok) {
				onSave?.(notes);
				onClose();
			}
		} catch (error) {
			console.error("Error saving notes:", error);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg bg-[var(--surface-bg)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-[var(--text-primary)]">
						Notes for {channelName}
					</h2>
					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
					>
						<X className="w-5 h-5 text-[var(--text-muted)]" />
					</button>
				</div>

				{/* Textarea */}
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Add your notes about this channel..."
					className="w-full h-40 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-primary)]/50"
				/>

				{/* Footer */}
				<div className="flex justify-end gap-3 mt-4">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						<Save className="w-4 h-4" />
						{saving ? "Saving..." : "Save Notes"}
					</button>
				</div>
			</div>
		</div>
	);
}
