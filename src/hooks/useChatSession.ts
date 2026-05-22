/**
 * Chat-session hook for the standalone web UI.
 *
 * This hook keeps one canonical message shape for both:
 * - session snapshots loaded from `GET /sessions/{id}`
 * - live SSE updates returned by `POST /sessions` and `POST /sessions/{id}/messages`
 *
 * Keeping those two sources aligned avoids duplicate optimistic messages,
 * unstable process/assistant ordering, and refresh-time transcript drift.
 */

import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../lib/api-base-url";
import {
	appendProcessStepToPlaceholder,
	attachDeltaToAssistant,
	type MessageEntry,
	normalizeSessionEntries,
	type SessionSnapshotEntry,
	stopLatestWorkingAssistant,
	updateAssistantProcessStatus,
} from "./chat-message-state";

type SessionSnapshot = {
	sessionId: string;
	sessionName: string;
	status: "idle" | "running" | "error";
	entries: SessionSnapshotEntry[];
};

export interface SessionData {
	sessionId: string;
	sessionName: string;
	status: "idle" | "running" | "error";
}

type NewSessionModelSelection = {
	providerConfigId: string;
	modelId?: string;
	thinkingLevel?: string;
};

const API_BASE_URL = getApiBaseUrl();

const buildSessionsUrl = (sessionId: string) => {
	return `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`;
};

const buildStreamUrl = (sessionId?: string | null) => {
	const basePath = sessionId ? `/sessions/${encodeURIComponent(sessionId)}/messages` : "/sessions";
	const params = new URLSearchParams({
		includeProcess: "true",
	});

	return `${API_BASE_URL}${basePath}?${params.toString()}`;
};

export function useChatSession(initialSessionId?: string, onSessionCreated?: (sessionId: string) => void) {
	const [messages, setMessages] = useState<MessageEntry[]>([]);
	const [session, setSession] = useState<SessionData | null>(
		initialSessionId
			? {
					sessionId: initialSessionId,
					sessionName: "",
					status: "idle",
				}
			: null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const fetchRequestIdRef = useRef(0);
	const activeStreamIdRef = useRef(0);
	const currentViewedSessionIdRef = useRef<string | null>(initialSessionId || null);
	const streamingForSessionRef = useRef<string | null>(null);

	useEffect(() => {
		if (initialSessionId === currentViewedSessionIdRef.current) {
			return;
		}
		currentViewedSessionIdRef.current = initialSessionId || null;

		/**
		 * Route changes define the viewed session. Reset the local view immediately
		 * so the old transcript/title cannot remain visible while the next snapshot
		 * is loading, and invalidate any in-flight fetch or stream callbacks.
		 */
		fetchRequestIdRef.current += 1;
		activeStreamIdRef.current += 1;

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}

		setIsLoading(false);
		setMessages([]);
		setSession(
			initialSessionId
				? {
						sessionId: initialSessionId,
						sessionName: "",
						status: "idle",
					}
				: null,
		);
	}, [initialSessionId]);

	const fetchSession = useCallback(async (id: string) => {
		if (streamingForSessionRef.current === id) {
			return;
		}

		const requestId = fetchRequestIdRef.current + 1;
		fetchRequestIdRef.current = requestId;

		try {
			const res = await fetch(buildSessionsUrl(id), {
				credentials: "include",
			});

			if (!res.ok) {
				if (fetchRequestIdRef.current === requestId) {
					setSession(null);
					setMessages([]);
				}
				return;
			}

			const data = (await res.json()) as SessionSnapshot;

			if (fetchRequestIdRef.current !== requestId) {
				return;
			}

			setSession({
				sessionId: data.sessionId,
				sessionName: data.sessionName,
				status: data.status,
			});
			setMessages((prev) => {
				const normalizedEntries = normalizeSessionEntries(data.entries || []);

				/**
				 * A just-created session can briefly return an empty running snapshot
				 * before the transcript file is readable. Keep the live in-memory
				 * conversation until the server can return a non-empty transcript.
				 */
				if (data.status === "running" && normalizedEntries.length === 0 && prev.length > 0) {
					return prev;
				}

				return normalizedEntries;
			});
		} catch (error) {
			if (fetchRequestIdRef.current !== requestId) {
				return;
			}

			console.error("Failed to fetch session", error);
		}
	}, []);

	const handleSSEMessage = useCallback(
		(event: string, data: Record<string, unknown>) => {
			switch (event) {
			case "session.created":
				streamingForSessionRef.current = String(data.sessionId);
				currentViewedSessionIdRef.current = String(data.sessionId);
				setSession({
					sessionId: String(data.sessionId),
					sessionName: String(data.sessionName),
					status: "running",
				});
				window.dispatchEvent(new CustomEvent("agentos-session-changed"));
				onSessionCreated?.(String(data.sessionId));
				break;
			case "message.accepted":
				setMessages((prev) => {
					const entry = data.entry as SessionSnapshotEntry;
					const filtered = prev.filter((m) => !m.id.startsWith("optimistic_"));

						if (filtered.find((message) => message.id === entry.id)) {
							return filtered;
						}

						return [
							...filtered,
							{
								id: entry.id,
								parentId: entry.parentId,
								createdAt: entry.createdAt,
								messageType: "user",
								content: entry.content,
							},
						];
					});
					break;
				case "process.delta":
					setMessages((prev) =>
						appendProcessStepToPlaceholder(prev, String(data.entryId), String(data.parentId), {
							id: `reasoning_${Math.random().toString(36).slice(2)}`,
							type: "reasoning",
							content: String(data.text || ""),
						}),
					);
					break;
				case "action.started":
					setMessages((prev) =>
						appendProcessStepToPlaceholder(prev, String(data.entryId), String(data.parentId), {
							id: String(data.toolCallId),
							type: "tool_call",
							title: `Tool: ${String(data.name)}`,
							content: String(data.arguments || "{}"),
							status: "started",
						}),
					);
					break;
				case "action.completed":
					setMessages((prev) =>
						appendProcessStepToPlaceholder(prev, String(data.entryId), String(data.parentId), {
							id: `${String(data.toolCallId)}_result`,
							type: "tool_result",
							title: `Result: ${String(data.name)}`,
							content: String(data.result || ""),
							status: "completed",
						}),
					);
					break;
				case "action.failed":
					setMessages((prev) =>
						appendProcessStepToPlaceholder(prev, String(data.entryId), String(data.parentId), {
							id: `${String(data.toolCallId)}_error`,
							type: "tool_result",
							title: `Error: ${String(data.name)}`,
							content: String(data.error || "Failed"),
							status: "error",
						}),
					);
					break;
				case "final.output.delta":
					setMessages((prev) =>
						attachDeltaToAssistant(prev, String(data.entryId), String(data.parentId), String(data.text || "")),
					);
					break;
				case "final.output.completed":
					setMessages((prev) => updateAssistantProcessStatus(prev, String(data.entryId), "completed"));
					setSession((prev) => (prev ? { ...prev, status: "idle" } : null));
					setIsLoading(false);
					break;
				case "run.failed":
					setMessages((prev) => stopLatestWorkingAssistant(prev));
					setSession((prev) => (prev ? { ...prev, status: "error" } : null));
					setIsLoading(false);
					break;
				case "run.cancelled":
					setMessages((prev) => stopLatestWorkingAssistant(prev));
					setSession((prev) => (prev ? { ...prev, status: "idle" } : null));
					setIsLoading(false);
					break;
				default:
					break;
			}
		},
		[onSessionCreated],
	);

	const sendMessage = useCallback(
		async (
			content: string,
			currentSessionId?: string | null,
			newSessionModelSelection?: NewSessionModelSelection,
		) => {
			const streamId = activeStreamIdRef.current + 1;
			activeStreamIdRef.current = streamId;

			const optimisticMessage: MessageEntry = {
				id: `optimistic_${Date.now()}`,
				parentId: null,
				createdAt: new Date().toISOString(),
				messageType: "user",
				content: [{ type: "text", text: content }],
			};

			setMessages((prev) => [...prev, optimisticMessage]);
			setIsLoading(true);
			setSession((prev) => (prev ? { ...prev, status: "running" } : null));

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			const ctrl = new AbortController();
			abortControllerRef.current = ctrl;

			try {
				await fetchEventSource(buildStreamUrl(currentSessionId), {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
						Accept: "text/event-stream",
					},
					body: JSON.stringify({
						...(currentSessionId
							? {}
							: {
									providerConfigId: newSessionModelSelection?.providerConfigId,
									modelId: newSessionModelSelection?.modelId,
									thinkingLevel: newSessionModelSelection?.thinkingLevel,
								}),
						input: {
							content: [{ type: "text", text: content }],
						},
					}),
					signal: ctrl.signal,
					async onopen(response) {
						if (response.ok) {
							return;
						}

						const errorText = await response.text();
						throw new Error(`stream request failed: ${response.status} ${errorText}`);
					},
					onmessage(msg) {
						if (activeStreamIdRef.current !== streamId) {
							return;
						}

						if (!msg.event || !msg.data) {
							return;
						}

						try {
							handleSSEMessage(msg.event, JSON.parse(msg.data) as Record<string, unknown>);
						} catch (error) {
							console.error("Parse SSE data error", error);
						}
					},
					onclose() {
						if (activeStreamIdRef.current !== streamId) {
							return;
						}

						setIsLoading(false);
					},
					onerror(error) {
						if (activeStreamIdRef.current !== streamId) {
							throw error;
						}

						console.error("SSE Error", error);
						setIsLoading(false);
						setSession((prev) => (prev ? { ...prev, status: "error" } : null));
						throw error;
					},
				});
			} catch (error) {
				console.error("Failed to send message", error);
				setIsLoading(false);
			}
		},
		[handleSSEMessage],
	);

	const cancelRun = useCallback(async () => {
		if (session?.sessionId && session.status === "running") {
			try {
				await fetch(`${buildSessionsUrl(session.sessionId)}/cancel`, {
					method: "POST",
					credentials: "include",
				});
			} catch (error) {
				console.error("Failed to cancel session", error);
			}
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		setIsLoading(false);
		setSession((prev) => (prev ? { ...prev, status: "idle" } : null));
	}, [session]);

	return {
		messages,
		session,
		isLoading,
		sendMessage,
		cancelRun,
		fetchSession,
	};
}
