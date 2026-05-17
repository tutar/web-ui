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
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

type ToolCallStatus = "started" | "completed" | "error";

type ProcessStep =
  | {
      id: string;
      type: "reasoning";
      content: string;
    }
  | {
      id: string;
      type: "tool_call";
      title: string;
      content: string;
      status: ToolCallStatus;
    }
  | {
      id: string;
      type: "tool_result";
      title: string;
      content: string;
      status: "completed" | "error";
    };

export interface MessageContentItem {
  type: "text" | "image" | "video" | "tool_call";
  text?: string;
  url?: string;
  toolCallId?: string;
  toolName?: string;
  status?: ToolCallStatus;
  arguments?: string;
  result?: string;
  error?: string;
}

export interface MessageEntry {
  id: string;
  parentId: string | null;
  createdAt: string;
  messageType: "user" | "assistant";
  content: MessageContentItem[];
  processSteps?: ProcessStep[];
}

type SessionSnapshotEntry = {
  id: string;
  parentId: string | null;
  createdAt: string;
  messageType: "user" | "process" | "assistant";
  content: MessageContentItem[];
};

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

const API_BASE_URL = (
  import.meta.env.VITE_MANAGED_AGENT_API_BASE_URL || "http://127.0.0.1:3000"
).replace(/\/$/, "");
const DEFAULT_USER_ID =
  import.meta.env.VITE_MANAGED_AGENT_USER_ID || "demo-user";

const buildSessionsUrl = (sessionId: string) => {
  return `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`;
};

const mapProcessContentToSteps = (content: MessageContentItem[]): ProcessStep[] => {
  return content.flatMap((item) => {
    if (item.type === "text" && item.text) {
      return [
        {
          id: `reasoning_${Math.random().toString(36).slice(2)}`,
          type: "reasoning" as const,
          content: item.text,
        },
      ];
    }

    if (item.type !== "tool_call" || !item.toolCallId || !item.toolName || !item.status) {
      return [];
    }

    const steps: ProcessStep[] = [
      {
        id: item.toolCallId,
        type: "tool_call",
        title: `Tool: ${item.toolName}`,
        content: item.arguments || "{}",
        status: item.status,
      },
    ];

    if (item.status === "completed" && item.result) {
      steps.push({
        id: `${item.toolCallId}_result`,
        type: "tool_result",
        title: `Result: ${item.toolName}`,
        content: item.result,
        status: "completed",
      });
    }

    if (item.status === "error" && item.error) {
      steps.push({
        id: `${item.toolCallId}_error`,
        type: "tool_result",
        title: `Error: ${item.toolName}`,
        content: item.error,
        status: "error",
      });
    }

    return steps;
  });
};

const normalizeSessionEntries = (entries: SessionSnapshotEntry[]): MessageEntry[] => {
  const processEntryById = new Map(
    entries
      .filter((entry) => entry.messageType === "process")
      .map((entry) => [entry.id, entry] as const),
  );

  return entries.reduce<MessageEntry[]>((normalizedEntries, entry) => {
    if (entry.messageType === "user") {
      normalizedEntries.push({
        id: entry.id,
        parentId: entry.parentId,
        createdAt: entry.createdAt,
        messageType: "user",
        content: entry.content,
      });
      return normalizedEntries;
    }

    if (entry.messageType === "assistant") {
      const processEntry = entry.parentId
        ? processEntryById.get(entry.parentId)
        : undefined;

      normalizedEntries.push({
        id: entry.id,
        parentId: entry.parentId,
        createdAt: entry.createdAt,
        messageType: "assistant",
        content: entry.content,
        processSteps: processEntry
          ? mapProcessContentToSteps(processEntry.content)
          : [],
      });
    }

    return normalizedEntries;
  }, []);
};

const createPlaceholderAssistant = (
  entryId: string,
  parentId: string,
  createdAt: string,
): MessageEntry => {
  return {
    id: entryId,
    parentId,
    createdAt,
    messageType: "assistant",
    content: [],
    processSteps: [],
  };
};

const appendProcessStepToPlaceholder = (
  messages: MessageEntry[],
  entryId: string,
  parentId: string,
  step: ProcessStep,
): MessageEntry[] => {
  let found = false;

  const nextMessages = messages.map((message) => {
    if (message.id !== entryId) {
      return message;
    }

    found = true;
    return {
      ...message,
      processSteps: [...(message.processSteps || []), step],
    };
  });

  if (found) {
    return nextMessages;
  }

  return [
    ...messages,
    {
      ...createPlaceholderAssistant(entryId, parentId, new Date().toISOString()),
      processSteps: [step],
    },
  ];
};

const attachDeltaToAssistant = (
  messages: MessageEntry[],
  entryId: string,
  parentId: string,
  text: string,
): MessageEntry[] => {
  let placeholderSteps: ProcessStep[] = [];
  let foundAssistant = false;

  const withoutPlaceholder = messages.filter((message) => {
    if (message.id === parentId) {
      placeholderSteps = message.processSteps || [];
      return false;
    }

    return true;
  });

  const nextMessages = withoutPlaceholder.map((message) => {
    if (message.id !== entryId) {
      return message;
    }

    foundAssistant = true;
    const nextContent = [...message.content];
    const textItem = nextContent.find((item) => item.type === "text");

    if (textItem) {
      textItem.text = `${textItem.text || ""}${text}`;
    } else {
      nextContent.push({ type: "text", text });
    }

    return {
      ...message,
      content: nextContent,
      processSteps:
        message.processSteps && message.processSteps.length > 0
          ? message.processSteps
          : placeholderSteps,
    };
  });

  if (foundAssistant) {
    return nextMessages;
  }

  return [
    ...nextMessages,
    {
      id: entryId,
      parentId,
      createdAt: new Date().toISOString(),
      messageType: "assistant",
      content: [{ type: "text", text }],
      processSteps: placeholderSteps,
    },
  ];
};

const buildStreamUrl = (sessionId?: string | null) => {
  const basePath = sessionId
    ? `/sessions/${encodeURIComponent(sessionId)}/messages`
    : "/sessions";
  const params = new URLSearchParams({
    userId: DEFAULT_USER_ID,
    includeProcess: "true",
  });

  return `${API_BASE_URL}${basePath}?${params.toString()}`;
};

export function useChatSession(
  initialSessionId?: string,
  onSessionCreated?: (sessionId: string) => void,
) {
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
    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;

    try {
      const res = await fetch(buildSessionsUrl(id));

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
      setMessages(normalizeSessionEntries(data.entries || []));
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
            const filtered = prev.filter(m => !m.id.startsWith("optimistic_"));

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
            attachDeltaToAssistant(
              prev,
              String(data.entryId),
              String(data.parentId),
              String(data.text || ""),
            ),
          );
          break;
        case "final.output.completed":
          setSession((prev) => (prev ? { ...prev, status: "idle" } : null));
          setIsLoading(false);
          break;
        case "run.failed":
          setSession((prev) => (prev ? { ...prev, status: "error" } : null));
          setIsLoading(false);
          break;
        case "run.cancelled":
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
    async (content: string, currentSessionId?: string | null) => {
      const streamId = activeStreamIdRef.current + 1;
      activeStreamIdRef.current = streamId;
      
      const optimisticMessage: MessageEntry = {
        id: `optimistic_${Date.now()}`,
        parentId: null,
        createdAt: new Date().toISOString(),
        messageType: 'user',
        content: [{ type: 'text', text: content }],
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
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            ...(currentSessionId
              ? {}
              : {
                  model: "deepseek/deepseek-v4-pro",
                  thinkingLevel: "medium",
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
            throw new Error(
              `stream request failed: ${response.status} ${errorText}`,
            );
          },
          onmessage(msg) {
            if (activeStreamIdRef.current !== streamId) {
              return;
            }

            if (!msg.event || !msg.data) {
              return;
            }

            try {
              handleSSEMessage(
                msg.event,
                JSON.parse(msg.data) as Record<string, unknown>,
              );
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
