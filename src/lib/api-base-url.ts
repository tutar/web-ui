/**
 * Resolve the managed-agent API base URL for the browser client.
 *
 * Local auth uses SameSite=Lax cookies, so the default API origin must stay on
 * the same site as the page origin. When no explicit env var is provided, we
 * reuse the current browser hostname and only swap the API port.
 */
const FALLBACK_API_PORT = "4173";
const LOCAL_LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0", "::1"]);

const isLoopbackHost = (hostname: string) => {
	return LOCAL_LOOPBACK_HOSTS.has(hostname);
};

/**
 * Build the API base URL for browser-side requests.
 *
 * `VITE_MANAGED_AGENT_API_BASE_URL` still wins when explicitly configured, but
 * the local default is derived from the current page origin to avoid mixing
 * `localhost` and `127.0.0.1`, which would otherwise suppress auth cookies.
 */
export const getApiBaseUrl = () => {
	const configuredBaseUrl = import.meta.env.VITE_MANAGED_AGENT_API_BASE_URL;

	if (configuredBaseUrl) {
		const normalizedConfiguredBaseUrl = configuredBaseUrl.replace(/\/$/, "");

		/**
		 * Keep local browser development on a single loopback hostname even when a
		 * stale `.env` still points at another loopback alias. This preserves the
		 * login cookie across refreshes because the auth cookie stays same-site.
		 */
		if (typeof window !== "undefined") {
			const configuredUrl = new URL(normalizedConfiguredBaseUrl);

			if (isLoopbackHost(configuredUrl.hostname) && isLoopbackHost(window.location.hostname)) {
				configuredUrl.hostname = window.location.hostname;
				return configuredUrl.toString().replace(/\/$/, "");
			}
		}

		return normalizedConfiguredBaseUrl;
	}

	if (typeof window !== "undefined") {
		return `${window.location.protocol}//${window.location.hostname}:${FALLBACK_API_PORT}`;
	}

	return `http://127.0.0.1:${FALLBACK_API_PORT}`;
};
