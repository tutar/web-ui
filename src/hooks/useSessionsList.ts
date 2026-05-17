/**
 * Session-list hook for the standalone web UI.
 *
 * The API base URL must stay environment-driven so local development talks to
 * the intended managed-agent-api instance instead of a stale external tunnel.
 */
import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

export interface SessionListItem {
	sessionId: string;
	sessionName: string;
	status: "idle" | "running" | "error";
	createdAt: string;
	lastActiveAt: string;
}

export function useSessionsList(_userId: string = "demo-user") {
	const [sessions, setSessions] = useState<SessionListItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loadingMore, setLoadingMore] = useState(false);

	const fetchSessions = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE_URL}/me/sessions`, {
				credentials: "include",
			});
			if (res.ok) {
				const data = await res.json();
				setSessions(data.items || []);
				setHasMore(data.hasMore || false);
				setNextCursor(data.nextCursor || null);
			}
		} catch (e) {
			console.error("Failed to fetch sessions", e);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadMore = useCallback(async () => {
		if (!hasMore || !nextCursor || loadingMore) return;

		setLoadingMore(true);
		try {
			const params = new URLSearchParams();
			if (nextCursor) params.append("cursor", nextCursor);

			const res = await fetch(`${API_BASE_URL}/me/sessions?${params.toString()}`, {
				credentials: "include",
			});
			if (res.ok) {
				const data = await res.json();
				setSessions((prev) => [...prev, ...(data.items || [])]);
				setHasMore(data.hasMore || false);
				setNextCursor(data.nextCursor || null);
			}
		} catch (e) {
			console.error("Failed to load more sessions", e);
		} finally {
			setLoadingMore(false);
		}
	}, [hasMore, nextCursor, loadingMore]);

	useEffect(() => {
		fetchSessions();

		const handleSessionChanged = () => {
			fetchSessions();
		};

		window.addEventListener("agentos-session-changed", handleSessionChanged);
		return () => {
			window.removeEventListener("agentos-session-changed", handleSessionChanged);
		};
	}, [fetchSessions]);

	return {
		sessions,
		loading,
		loadingMore,
		hasMore,
		loadMore,
		refetch: fetchSessions,
	};
}
