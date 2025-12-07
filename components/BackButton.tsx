"use client";

import { Button } from "@whop/react/components";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

interface BackButtonProps {
	href?: string;
	className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
	const router = useRouter();

	const handleBack = () => {
		if (href) {
			router.push(href);
		} else {
			router.back();
		}
	};

	return (
		<Button
			variant="ghost"
			size="2"
			color="gray"
			onClick={handleBack}
			className={className}
		>
			<ArrowLeftIcon className="mr-2 w-4 h-4" />
			Back
		</Button>
	);
}

