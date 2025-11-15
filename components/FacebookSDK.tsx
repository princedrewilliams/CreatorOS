"use client";

import { useEffect } from "react";

declare global {
	interface Window {
		FB: any;
		fbAsyncInit: () => void;
	}
}

export function FacebookSDK() {
	useEffect(() => {
		// Only load Facebook SDK if App ID is explicitly configured
		// Don't use fallback - Facebook validates App IDs strictly
		const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
		
		// Only load SDK if we have a valid App ID and we're on HTTPS (required by Facebook)
		const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
		const isLocalhost = typeof window !== "undefined" && 
			(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
		
		if (!appId || !isHttps || isLocalhost) {
			// Don't load Facebook SDK on localhost/HTTP or without App ID
			return;
		}

		// Initialize Facebook SDK
		window.fbAsyncInit = function () {
			if (!appId || appId.length < 10) {
				console.warn("Facebook App ID is invalid or not configured");
				return;
			}

			try {
				window.FB.init({
					appId: appId,
					cookie: true,
					xfbml: true,
					version: "v18.0",
				});

				window.FB.AppEvents.logPageView();
			} catch (error) {
				console.error("Error initializing Facebook SDK:", error);
			}
		};

		// Load Facebook SDK script only if conditions are met
		(function (d, s, id) {
			const js = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) return;
			const fjs = d.createElement(s) as HTMLScriptElement;
			fjs.id = id;
			fjs.src = "https://connect.facebook.net/en_US/sdk.js";
			if (js.parentNode) {
				js.parentNode.insertBefore(fjs, js);
			}
		})(document, "script", "facebook-jssdk");
	}, []);

	return null;
}

