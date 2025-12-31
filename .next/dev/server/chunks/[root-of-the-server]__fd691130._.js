module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/[...slug]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/server.js [app-route] (ecmascript)");
;
async function GET(request, { params }) {
    const { slug } = await params;
    const path = slug.join("/");
    const filename = slug[slug.length - 1] || "";
    // Handle TikTok and Google verification files only
    // Don't interfere with Next.js file-based routing - let Next.js handle other routes
    const isTiktokVerification = filename.includes("tiktok") || path.includes("tiktok");
    const isGoogleVerification = filename.startsWith("google") && (filename.endsWith(".html") || filename.endsWith(".txt"));
    // Only handle verification files - let Next.js handle everything else
    if (!isTiktokVerification && !isGoogleVerification) {
        // Return 404 only for verification-like paths, otherwise let Next.js handle it
        // This prevents the catch-all from interfering with normal routing
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]("Not Found", {
            status: 404
        });
    }
    // Handle Google verification files
    if (isGoogleVerification) {
        // Specific Google verification file for URL prefix verification
        if (filename === "google3370ca22a926d585.html") {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]("google-site-verification: google3370ca22a926d585.html", {
                headers: {
                    "Content-Type": "text/html; charset=utf-8"
                }
            });
        }
        // Extract verification code from filename for other Google verification files
        // Pattern: google[verification-code].html or google-site-verification.html
        let verificationCode = filename.match(/google([A-Za-z0-9_-]+)\.(html|txt)/)?.[1];
        // If filename is google-site-verification.html, try to get code from environment or use placeholder
        if (!verificationCode && filename === "google-site-verification.html") {
            verificationCode = process.env.GOOGLE_SITE_VERIFICATION_CODE || "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE";
        }
        if (!verificationCode) {
            // Try alternative pattern - extract everything between "google" and ".html"
            const match = filename.match(/google(.+?)\.(html|txt)$/);
            if (match) {
                verificationCode = match[1];
            } else {
                verificationCode = filename.replace("google", "").replace(".html", "").replace(".txt", "").replace("site-verification", "");
            }
        }
        // Google verification files typically contain a meta tag with the verification code
        // The verification code should be obtained from the downloaded file from Google Search Console
        // Update GOOGLE_SITE_VERIFICATION_CODE in environment variables with the actual code
        const actualVerificationCode = process.env.GOOGLE_SITE_VERIFICATION_CODE || verificationCode || "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE";
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
	<meta name="google-site-verification" content="${actualVerificationCode}" />
	<title>Google Site Verification</title>
</head>
<body>
	google-site-verification: ${filename}
</body>
</html>`;
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](htmlContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            }
        });
    }
    // Check if this is a TikTok verification file (by filename pattern)
    if (isTiktokVerification) {
        // Try to extract verification code from filename
        // Pattern 1: tiktok-developers-site-verification=CODE
        let verificationCode = path.match(/tiktok-developers-site-verification=([^/.\s]+)/)?.[1];
        // Pattern 2: tiktok[random string].txt - extract the random string
        if (!verificationCode && filename.includes("tiktok")) {
            const match = filename.match(/tiktok([A-Za-z0-9]+)/);
            if (match) {
                verificationCode = match[1];
            }
        }
        // Pattern 3: Check if filename matches the pattern from analytics (tiktokTUSHeQRSCqZve6ZWGWGJW1DvYTtjmFON.txt)
        // Extract the code part after "tiktok"
        if (!verificationCode && filename.startsWith("tiktok") && filename.endsWith(".txt")) {
            const codePart = filename.replace("tiktok", "").replace(".txt", "");
            if (codePart.length > 10) {
                verificationCode = codePart;
            }
        }
        // If we found a code, return it; otherwise return placeholder
        const code = verificationCode || "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE";
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](`tiktok-developers-site-verification=${code}`, {
            headers: {
                "Content-Type": "text/plain"
            }
        });
    }
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]("Not Found", {
        status: 404
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__fd691130._.js.map