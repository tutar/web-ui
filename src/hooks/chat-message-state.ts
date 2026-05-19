/**
 * Pure chat-message state helpers for the web UI.
 *
 * These helpers keep the live SSE path and the refreshed transcript path on
 * one canonical assistant-message shape so process state and streamed reply
 * text stay aligned.
 */

export type ToolCallStatus = "started" | "completed" | "error";
export type ProcessStatus = "working" | "completed" | "stopped";

export type ProcessStep =
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
	processStatus?: ProcessStatus | null;
}

export type SessionSnapshotEntry = {
	id: string;
	parentId: string | null;
	createdAt: string;
	messageType: "user" | "process" | "assistant";
	content: MessageContentItem[];
};

/**
 * Flatten persisted process content back into the UI's step model.
 */
export const mapProcessContentToSteps = (content: MessageContentItem[]): ProcessStep[] => {
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

/**
 * Normalize API transcript entries into one assistant node per user turn.
 */
export const normalizeSessionEntries = (entries: SessionSnapshotEntry[]): MessageEntry[] => {
	const processEntryById = new Map(
		entries.filter((entry) => entry.messageType === "process").map((entry) => [entry.id, entry] as const),
	);

	return entries.reduce<MessageEntry[]>((normalizedEntries, entry) => {
		if (entry.messageType === "user") {
			normalizedEntries.push({
				id: entry.id,
				parentId: entry.parentId,
				createdAt: entry.createdAt,
				messageType: "user",
				content: entry.content,
				processStatus: null,
			});
			return normalizedEntries;
		}

		if (entry.messageType === "assistant") {
			const processEntry = entry.parentId ? processEntryById.get(entry.parentId) : undefined;
			const hasAssistantText = entry.content.some((item) => item.type === "text" && (item.text || "").length > 0);

			normalizedEntries.push({
				id: entry.id,
				parentId: entry.parentId,
				createdAt: entry.createdAt,
				messageType: "assistant",
				content: entry.content,
				processSteps: processEntry ? mapProcessContentToSteps(processEntry.content) : [],
				processStatus: processEntry ? (hasAssistantText ? "completed" : "stopped") : null,
			});
		}

		return normalizedEntries;
	}, []);
};

/**
 * Create the assistant container that receives both process steps and the
 * streamed final answer for a single user turn.
 */
export const createPlaceholderAssistant = (entryId: string, parentId: string, createdAt: string): MessageEntry => {
	return {
		id: entryId,
		parentId,
		createdAt,
		messageType: "assistant",
		content: [],
		processSteps: [],
		processStatus: "working",
	};
};

/**
 * Append one process-side step to the assistant message for a turn.
 */
export const appendProcessStepToPlaceholder = (
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
			processStatus: "working" as const,
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

/**
 * Append streamed assistant text to the single assistant node for the turn.
 */
export const attachDeltaToAssistant = (
	messages: MessageEntry[],
	entryId: string,
	parentId: string,
	text: string,
): MessageEntry[] => {
	let placeholderSteps: ProcessStep[] = [];
	let placeholderStatus: ProcessStatus | null = "working";
	let foundAssistant = false;

	const withoutPlaceholder = messages.filter((message) => {
		if (message.id.startsWith("optimistic_assistant_")) {
			placeholderSteps = message.processSteps || placeholderSteps;
			placeholderStatus = message.processStatus ?? placeholderStatus;
			return false;
		}

		if (message.id === parentId) {
			placeholderSteps = message.processSteps || [];
			placeholderStatus = message.processStatus ?? "working";
			return false;
		}

		return true;
	});

	const nextMessages = withoutPlaceholder.map((message) => {
		if (message.id !== entryId) {
			return message;
		}

		foundAssistant = true;
		const existingTextIndex = message.content.findIndex((item) => item.type === "text");

		const nextContent =
			existingTextIndex >= 0
				? message.content.map((item, i) =>
						i === existingTextIndex ? { ...item, text: `${item.text || ""}${text}` } : item,
					)
				: [...message.content, { type: "text" as const, text }];

		return {
			...message,
			content: nextContent,
			processSteps:
				message.processSteps && message.processSteps.length > 0 ? message.processSteps : placeholderSteps,
			processStatus: message.processStatus ?? placeholderStatus ?? "working",
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
			processStatus: placeholderStatus ?? "working",
		},
	];
};

/**
 * Update a specific assistant message's process lifecycle status.
 */
export const updateAssistantProcessStatus = (
	messages: MessageEntry[],
	entryId: string,
	processStatus: ProcessStatus,
): MessageEntry[] => {
	return messages.map((message) => (message.id === entryId ? { ...message, processStatus } : message));
};

/**
 * Mark the latest in-progress assistant message as stopped when a run is
 * cancelled or fails before a terminal assistant completion event arrives.
 */
export const stopLatestWorkingAssistant = (messages: MessageEntry[]): MessageEntry[] => {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.messageType === "assistant" && message.processStatus === "working") {
			return messages.map((currentMessage, currentIndex) =>
				currentIndex === index ? { ...currentMessage, processStatus: "stopped" as const } : currentMessage,
			);
		}
	}

	return messages;
};
