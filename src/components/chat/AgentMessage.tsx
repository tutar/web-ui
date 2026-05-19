/**
 * Renders the assistant's formal reply alongside its optional process timeline.
 *
 * The process header shows lifecycle state for the secondary process stream,
 * while the markdown body renders the primary reply as soon as text deltas
 * arrive.
 */

import { Check, ChevronDown, ChevronRight, Copy, LoaderCircle, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import type { ProcessStatus, ProcessStep as ProcessStepModel } from "../../hooks/chat-message-state";
import { cn } from "../../lib/utils";
import { ProcessStep } from "./ProcessStep";

type MergedToolStep = Extract<ProcessStepModel, { type: "tool_call" }> & {
	resultStep?: Extract<ProcessStepModel, { type: "tool_result" }>;
};

type DisplayProcessStep = Exclude<ProcessStepModel, { type: "tool_call" }> | MergedToolStep;

type AgentMessageViewModel = {
	content: string;
	processSteps?: ProcessStepModel[];
	processStatus?: ProcessStatus | null;
};

const getProcessStatusLabel = (
	processStatus: ProcessStatus | null | undefined,
	t: ReturnType<typeof useTranslation>["t"],
) => {
	switch (processStatus) {
		case "working":
			return t("chat.processWorking", "working");
		case "completed":
			return t("chat.processCompleted", "completed");
		case "stopped":
			return t("chat.processStopped", "stopped");
		default:
			return "";
	}
};

export function AgentMessage({ message }: { message: AgentMessageViewModel }) {
	const { t } = useTranslation();
	const [showProcess, setShowProcess] = useState(false);
	const [copied, setCopied] = useState(false);
	const [liked, setLiked] = useState(false);
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackText, setFeedbackText] = useState("");

	const handleCopy = () => {
		if (!message.content) return;
		navigator.clipboard.writeText(message.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleLike = () => {
		setLiked(!liked);
		if (showFeedback) setShowFeedback(false);
	};

	const handleDislike = () => {
		setShowFeedback(true);
		setLiked(false);
	};

	const submitFeedback = () => {
		// Here you would typically send the feedback to your backend
		console.log("Feedback submitted:", feedbackText);
		setShowFeedback(false);
		setFeedbackText("");
	};

	const processSteps = message.processSteps || [];
	const mergedSteps: DisplayProcessStep[] = [];
	let currentToolCall: MergedToolStep | null = null;

	for (const step of processSteps) {
		if (step.type === "tool_call") {
			currentToolCall = { ...step, resultStep: null };
			mergedSteps.push(currentToolCall);
		} else if (step.type === "tool_result" && currentToolCall) {
			currentToolCall.resultStep = step;
			currentToolCall = null;
		} else {
			mergedSteps.push(step);
			currentToolCall = null;
		}
	}

	const processStatusLabel = getProcessStatusLabel(message.processStatus, t);
	const hasProcessHeader = processStatusLabel.length > 0;

	return (
		<div className="flex flex-col gap-3 w-full">
			{hasProcessHeader && (
				<div className="flex flex-col gap-2">
					<button
						onClick={() => setShowProcess(!showProcess)}
						aria-label={
							showProcess
								? t("chat.collapseProcess", "Collapse process")
								: t("chat.expandProcess", "Expand process")
						}
						title={
							showProcess
								? t("chat.collapseProcess", "Collapse process")
								: t("chat.expandProcess", "Expand process")
						}
						className="flex items-center gap-1.5 text-xs text-theme-text-secondary hover:text-theme-text transition-colors self-start px-2 py-1 rounded bg-theme-surface hover:bg-theme-surface-hover border border-theme-border"
					>
						{message.processStatus === "working" && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
						<span className="opacity-80">
							{processStatusLabel} ({mergedSteps.length})
						</span>
						{processSteps.length > 0 &&
							(showProcess ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
					</button>

					{showProcess && processSteps.length > 0 && (
						<div className="flex flex-col gap-2 pl-2 border-l-2 border-theme-border/50 ml-2 py-1">
							{mergedSteps.map((step) => (
								<ProcessStep key={step.id} step={step} />
							))}
						</div>
					)}
				</div>
			)}

			{message.content.length > 0 && (
				<div className="flex flex-col gap-2">
					<div className="prose prose-sm max-w-none w-full overflow-x-auto">
						<Markdown
							remarkPlugins={[remarkGfm]}
							components={{
								code({ node, inline, className, children, ...props }: any) {
									const match = /language-(\w+)/.exec(className || "");
									return !inline && match ? (
										<SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div" {...props}>
											{String(children).replace(/\n$/, "")}
										</SyntaxHighlighter>
									) : (
										<code className={className} {...props}>
											{children}
										</code>
									);
								},
							}}
						>
							{message.content}
						</Markdown>
					</div>

					<div className="flex items-center gap-2 mt-1">
						<button
							onClick={handleCopy}
							className="p-1.5 rounded text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-active transition-colors flex items-center gap-1.5"
							title={t("chat.copy")}
						>
							{copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
							<span className="text-[10px] uppercase tracking-wider hidden sm:inline-block">
								{copied ? t("chat.copied") : t("chat.copy")}
							</span>
						</button>
						<button
							onClick={handleLike}
							className={cn(
								"p-1.5 rounded transition-colors flex items-center gap-1.5",
								liked
									? "text-theme-accent bg-theme-accent/10 hover:bg-theme-accent/20"
									: "text-theme-text-secondary hover:text-theme-accent hover:bg-theme-surface-active",
							)}
							title={t("chat.like")}
						>
							<ThumbsUp className="w-3.5 h-3.5" />
						</button>
						<button
							onClick={handleDislike}
							className="p-1.5 rounded text-theme-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
							title={t("chat.dislike")}
						>
							<ThumbsDown className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			)}

			{showFeedback && (
				<div className="mt-2 p-3 sm:p-4 rounded-xl bg-theme-surface border border-theme-border/50 shadow-sm animate-in fade-in slide-in-from-top-2 relative">
					<button
						onClick={() => setShowFeedback(false)}
						className="absolute top-2 right-2 p-1 rounded-md text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-active transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
					<h4 className="text-sm font-medium text-theme-text mb-2 pr-6">{t("chat.feedbackTitle")}</h4>
					<textarea
						value={feedbackText}
						onChange={(e) => setFeedbackText(e.target.value)}
						placeholder={t("chat.feedbackPlaceholder")}
						className="w-full text-sm bg-theme-base border border-theme-border focus:border-theme-accent/50 rounded-lg p-3 outline-none text-theme-text placeholder:text-theme-text-muted resize-none min-h-[80px]"
					/>
					<div className="flex justify-end gap-2 mt-3">
						<button
							onClick={() => setShowFeedback(false)}
							className="px-3 py-1.5 text-xs font-medium text-theme-text-secondary hover:text-theme-text transition-colors"
						>
							{t("chat.cancel")}
						</button>
						<button
							onClick={submitFeedback}
							disabled={!feedbackText.trim()}
							className="px-3 py-1.5 text-xs font-medium bg-theme-accent text-theme-base rounded hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{t("chat.submit")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
