"use client";

import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import type { ConstraintViolation, ValidationResult } from "@/lib/replicate/types";

interface ViolationBadgeProps {
	violation: ConstraintViolation;
}

export function ViolationBadge({ violation }: ViolationBadgeProps) {
	const isError = violation.severity === "error";

	return (
		<div
			className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
				isError
					? "bg-red-500/10 border border-red-500/20"
					: "bg-amber-500/10 border border-amber-500/20"
			}`}
		>
			{isError ? (
				<XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
			) : (
				<AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
			)}
			<div className="flex-1">
				<p className={isError ? "text-red-400" : "text-amber-400"}>
					<span className="font-medium capitalize">{violation.field}</span>:{" "}
					{violation.constraint}
				</p>
				<p className="text-[var(--text-muted)] mt-0.5">
					<span>Got: </span>
					<span className="text-white">{violation.actual}</span>
					<span> | Expected: </span>
					<span className="text-white">{violation.expected}</span>
				</p>
			</div>
		</div>
	);
}

interface ValidationSummaryProps {
	result: ValidationResult;
}

export function ValidationSummary({ result }: ValidationSummaryProps) {
	const errorCount = result.violations.filter((v) => v.severity === "error").length;
	const warningCount = result.violations.filter((v) => v.severity === "warning").length;

	return (
		<div className="space-y-3">
			{/* Score bar */}
			<div className="flex items-center gap-3">
				<div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
					<div
						className={`h-full transition-all ${
							result.score >= 80
								? "bg-green-500"
								: result.score >= 50
								? "bg-amber-500"
								: "bg-red-500"
						}`}
						style={{ width: `${result.score}%` }}
					/>
				</div>
				<span
					className={`text-sm font-medium ${
						result.score >= 80
							? "text-green-400"
							: result.score >= 50
							? "text-amber-400"
							: "text-red-400"
					}`}
				>
					{result.score}%
				</span>
			</div>

			{/* Status */}
			<div className="flex items-center gap-4 text-xs">
				{result.valid ? (
					<div className="flex items-center gap-1.5 text-green-400">
						<CheckCircle className="w-4 h-4" />
						<span>Passes all required constraints</span>
					</div>
				) : (
					<div className="flex items-center gap-1.5 text-red-400">
						<XCircle className="w-4 h-4" />
						<span>{errorCount} required constraint{errorCount !== 1 ? "s" : ""} failed</span>
					</div>
				)}
				{warningCount > 0 && (
					<div className="flex items-center gap-1.5 text-amber-400">
						<AlertTriangle className="w-4 h-4" />
						<span>{warningCount} warning{warningCount !== 1 ? "s" : ""}</span>
					</div>
				)}
			</div>

			{/* Violations */}
			{result.violations.length > 0 && (
				<div className="space-y-2">
					{result.violations.map((violation, i) => (
						<ViolationBadge key={i} violation={violation} />
					))}
				</div>
			)}
		</div>
	);
}
