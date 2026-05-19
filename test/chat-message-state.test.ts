import assert from "node:assert/strict";
import test from "node:test";
import {
	appendProcessStepToPlaceholder,
	attachDeltaToAssistant,
	normalizeSessionEntries,
	stopLatestWorkingAssistant,
	updateAssistantProcessStatus,
	type MessageEntry,
} from "../src/hooks/chat-message-state.js";

test("process steps create a working assistant placeholder and deltas stream into the same message", () => {
	const afterProcess = appendProcessStepToPlaceholder([], "assistant_1", "user_1", {
		id: "reasoning_1",
		type: "reasoning",
		content: "planning",
	});

	assert.equal(afterProcess.length, 1);
	assert.equal(afterProcess[0].messageType, "assistant");
	assert.equal(afterProcess[0].processStatus, "working");
	assert.equal(afterProcess[0].processSteps?.length, 1);

	const afterFirstDelta = attachDeltaToAssistant(afterProcess, "assistant_1", "user_1", "Hello");
	const afterSecondDelta = attachDeltaToAssistant(afterFirstDelta, "assistant_1", "user_1", " world");

	assert.equal(afterSecondDelta.length, 1);
	assert.equal(afterSecondDelta[0].content[0]?.text, "Hello world");
	assert.equal(afterSecondDelta[0].processStatus, "working");
	assert.equal(afterSecondDelta[0].processSteps?.length, 1);
});

test("real assistant deltas replace the optimistic working placeholder", () => {
	const messages: MessageEntry[] = [
		{
			id: "optimistic_assistant_1",
			parentId: "optimistic_user_1",
			createdAt: new Date().toISOString(),
			messageType: "assistant",
			content: [],
			processSteps: [],
			processStatus: "working",
		},
	];

	const nextMessages = attachDeltaToAssistant(messages, "assistant_1", "process_1", "Hello");

	assert.equal(nextMessages.length, 1);
	assert.equal(nextMessages[0].id, "assistant_1");
	assert.equal(nextMessages[0].content[0]?.text, "Hello");
	assert.equal(nextMessages[0].processStatus, "working");
});

test("completed and stopped status updates preserve the same assistant message", () => {
	const workingMessages: MessageEntry[] = [
		{
			id: "assistant_1",
			parentId: "user_1",
			createdAt: new Date().toISOString(),
			messageType: "assistant",
			content: [{ type: "text", text: "partial" }],
			processSteps: [],
			processStatus: "working",
		},
	];

	const completedMessages = updateAssistantProcessStatus(workingMessages, "assistant_1", "completed");
	assert.equal(completedMessages[0].processStatus, "completed");

	const stoppedMessages = stopLatestWorkingAssistant(workingMessages);
	assert.equal(stoppedMessages[0].processStatus, "stopped");
});

test("snapshot normalization restores completed and stopped process states", () => {
	const completedMessages = normalizeSessionEntries([
		{
			id: "user_1",
			parentId: null,
			createdAt: "2026-05-19T00:00:00.000Z",
			messageType: "user",
			content: [{ type: "text", text: "prompt" }],
		},
		{
			id: "process_1",
			parentId: "user_1",
			createdAt: "2026-05-19T00:00:01.000Z",
			messageType: "process",
			content: [{ type: "text", text: "thinking" }],
		},
		{
			id: "assistant_1",
			parentId: "process_1",
			createdAt: "2026-05-19T00:00:02.000Z",
			messageType: "assistant",
			content: [{ type: "text", text: "answer" }],
		},
	]);

	assert.equal(completedMessages.length, 2);
	assert.equal(completedMessages[1].processStatus, "completed");

	const stoppedMessages = normalizeSessionEntries([
		{
			id: "user_1",
			parentId: null,
			createdAt: "2026-05-19T00:00:00.000Z",
			messageType: "user",
			content: [{ type: "text", text: "prompt" }],
		},
		{
			id: "process_1",
			parentId: "user_1",
			createdAt: "2026-05-19T00:00:01.000Z",
			messageType: "process",
			content: [{ type: "text", text: "thinking" }],
		},
		{
			id: "assistant_1",
			parentId: "process_1",
			createdAt: "2026-05-19T00:00:02.000Z",
			messageType: "assistant",
			content: [],
		},
	]);

	assert.equal(stoppedMessages[1].processStatus, "stopped");
});
