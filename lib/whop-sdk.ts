import { Whop } from "@whop/sdk";

const PLACEHOLDER_APP_ID = "placeholder_whop_app_id";

const rawAppId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
const appId = rawAppId && rawAppId !== PLACEHOLDER_APP_ID ? rawAppId : null;
const apiKey = process.env.WHOP_API_KEY;
const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

let whopClient: Whop | null = null;

if (appId && apiKey) {
	whopClient = new Whop({
		appID: appId,
		apiKey,
		webhookKey: webhookSecret ? Buffer.from(webhookSecret).toString("base64") : undefined,
	});
} else if (process.env.NODE_ENV !== "production") {
	console.warn(
		"[whop-sdk] Missing credentials. Set NEXT_PUBLIC_WHOP_APP_ID, WHOP_API_KEY, and WHOP_WEBHOOK_SECRET to enable Whop integrations."
	);
}

export const whopsdk = whopClient;
export const isWhopConfigured = Boolean(whopClient);
