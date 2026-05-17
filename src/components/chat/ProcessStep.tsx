import { Brain, ChevronDown, ChevronRight, Terminal, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function ProcessStep({ step }: { step: any }) {
	const [isExpanded, setIsExpanded] = useState(false);
	const { t } = useTranslation();

	const getIcon = () => {
		switch (step.type) {
			case "reasoning":
				return <Brain className="w-3.5 h-3.5 text-theme-accent" />;
			case "tool_call":
				return <Wrench className="w-3.5 h-3.5 text-blue-400" />;
			case "tool_result":
				return <Terminal className="w-3.5 h-3.5 text-green-400" />;
			default:
				return null;
		}
	};

	const getTitle = () => {
		if (step.type === "reasoning") return t("chat.stepReasoning");
		if (step.type === "tool_call") {
			const parts = (step.title || "").split(":");
			if (parts.length > 1) {
				return `${t("chat.stepToolCall")}: ${parts[1].trim()}`;
			}
			return t("chat.stepToolCall");
		}
		if (step.type === "tool_result") return t("chat.stepToolResult");
		return step.title;
	};

	return (
		<div className="border border-theme-border rounded-lg bg-theme-surface overflow-hidden transition-all text-xs">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center gap-2 p-2.5 hover:bg-theme-surface-hover transition-colors text-left"
			>
				{isExpanded ? (
					<ChevronDown className="w-4 h-4 text-theme-text-secondary" />
				) : (
					<ChevronRight className="w-4 h-4 text-theme-text-secondary" />
				)}
				{getIcon()}
				<span className="font-medium text-theme-text">{getTitle()}</span>
			</button>

			{isExpanded && (
				<div className="flex flex-col border-t border-theme-border divide-y divide-theme-border/50">
					<div className="p-3 bg-theme-surface-hover/30 font-mono text-theme-text-secondary overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed">
						<div className="text-[10px] text-theme-text-muted mb-1.5 uppercase font-sans tracking-wider">
							{t("chat.stepToolCallPayload", "Payload")}
						</div>
						{step.content}
					</div>
					{step.resultStep && (
						<div className="p-3 bg-theme-surface-hover/10 font-mono text-theme-text-secondary overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed border-l-2 border-l-green-500/50">
							<div className="text-[10px] text-theme-text-muted mb-1.5 uppercase font-sans tracking-wider flex items-center gap-1.5">
								<Terminal className="w-3 h-3 text-green-500/80" />
								{t("chat.stepToolResult")}
							</div>
							{step.resultStep.content}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
