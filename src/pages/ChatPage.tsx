import {
	MessageSquare,
	Mic,
	PanelRightClose,
	PanelRightOpen,
	Pause,
	Play,
	Plus,
	Send,
	SkipBack,
	SkipForward,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";
import { AgentMessage } from "../components/chat/AgentMessage";
import { SUB_AGENTS } from "../data/dummy";
import type { MessageEntry } from "../hooks/chat-message-state";
import { useChatSession } from "../hooks/useChatSession";
import { useModelConfigs } from "../hooks/useModelConfigs";
import { cn } from "../lib/utils";

function _AudioBookCard({ message }: { message: any }) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [chapterIdx, setChapterIdx] = useState(0);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<div className="w-[360px] bg-theme-surface-hover rounded border border-theme-border-muted overflow-hidden shadow-sm">
			<div className="p-4 border-b border-theme-border flex justify-between items-center relative">
				<span className="text-[10px] font-bold uppercase tracking-widest text-theme-accent">
					{t("chat.audioPlayer")}
				</span>

				<div className="relative">
					<button
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						className="flex items-center gap-1 text-[10px] text-theme-text-secondary hover:text-theme-text transition-colors outline-none max-w-[150px]"
					>
						<span className="truncate">{message.chapters[chapterIdx]}</span>
						<svg
							className={`w-3 h-3 flex-shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</button>

					{isDropdownOpen && (
						<div className="absolute right-0 top-full mt-1 w-48 bg-theme-surface border border-theme-border rounded shadow-xl py-1 z-20">
							{message.chapters.map((chap: string, idx: number) => (
								<button
									key={idx}
									onClick={() => {
										setChapterIdx(idx);
										setIsDropdownOpen(false);
									}}
									className={`w-full text-left px-3 py-2 text-[10px] transition-colors truncate ${
										idx === chapterIdx
											? "bg-theme-surface-hover text-theme-accent"
											: "text-theme-text-secondary hover:bg-theme-surface-hover hover:text-theme-text"
									}`}
								>
									{chap}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
			<div className="p-6 flex flex-col items-center gap-4">
				<div className="w-full bg-theme-surface-active h-1 rounded-full">
					<div className="bg-theme-accent h-full w-1/3 rounded-full relative">
						<div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-theme-text rounded-full shadow-[0_0_8px_var(--text-primary)]"></div>
					</div>
				</div>
				<div className="flex items-center gap-6">
					<button
						onClick={() => setChapterIdx(Math.max(0, chapterIdx - 1))}
						className="text-theme-text-secondary hover:text-theme-text transition-colors"
					>
						<SkipBack className="w-4 h-4" />
					</button>
					<button
						onClick={() => setIsPlaying(!isPlaying)}
						className="w-10 h-10 bg-theme-accent rounded-full flex items-center justify-center text-black hover:opacity-90 transition-opacity"
					>
						{isPlaying ? (
							<Pause className="w-5 h-5 flex-shrink-0" />
						) : (
							<Play className="w-5 h-5 ml-1 flex-shrink-0" />
						)}
					</button>
					<button
						onClick={() => setChapterIdx(Math.min(message.chapters.length - 1, chapterIdx + 1))}
						className="text-theme-text-secondary hover:text-theme-text transition-colors"
					>
						<SkipForward className="w-4 h-4" />
					</button>
				</div>
				<div className="text-[10px] text-theme-text-secondary tracking-widest uppercase">
					{isPlaying ? t("chat.playing") : t("chat.paused")}
				</div>
			</div>
		</div>
	);
}

export function ChatPage() {
	const { chatId } = useParams();
	const navigate = useNavigate();
	const { messages, session, isLoading, sendMessage, fetchSession } = useChatSession(
		chatId,
		useCallback(
			(newId: string) => {
				navigate(`/chats/${newId}`);
			},
			[navigate],
		),
	);
	const { configs: providerConfigs, isLoading: providersLoading } = useModelConfigs();
	const [inputVal, setInputVal] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [selectedProviderConfigId, setSelectedProviderConfigId] = useState("");
	const [selectedModelId, setSelectedModelId] = useState("");
	const [selectedThinkingLevel, setSelectedThinkingLevel] = useState("");
	const { t } = useTranslation();
	const messagesEndRef = React.useRef<HTMLDivElement>(null);
	const hasWorkingAssistant = messages.some(
		(message) => message.messageType === "assistant" && message.processStatus === "working",
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		if (chatId) {
			fetchSession(chatId);
		}
	}, [chatId, fetchSession]);

	useEffect(() => {
		const firstEnabledProvider = providerConfigs.find((providerConfig) => providerConfig.enabled);
		const selectedProviderStillEnabled = providerConfigs.some(
			(providerConfig) => providerConfig.providerConfigId === selectedProviderConfigId && providerConfig.enabled,
		);

		if (selectedProviderStillEnabled) {
			return;
		}

		if (firstEnabledProvider) {
			setSelectedProviderConfigId(firstEnabledProvider.providerConfigId);
			return;
		}

		setSelectedProviderConfigId("");
	}, [providerConfigs, selectedProviderConfigId]);

	const _currentChat = session;
	const isNewChat = !chatId; // if we don't have chatId, it's new
	const hasProviderConfigs = providerConfigs.some((providerConfig) => providerConfig.enabled);
	const selectedProviderConfig =
		providerConfigs.find((providerConfig) => providerConfig.providerConfigId === selectedProviderConfigId) ?? null;
	const selectedModel =
		selectedProviderConfig?.availableModels.find((availableModel) => availableModel.modelId === selectedModelId) ??
		null;
	const availableThinkingLevels = selectedModel?.supportedThinkingLevels ?? [];

	useEffect(() => {
		if (!selectedProviderConfig) {
			setSelectedModelId("");
			setSelectedThinkingLevel("");
			return;
		}

		const selectedModelStillAvailable = selectedProviderConfig.availableModels.some(
			(availableModel) => availableModel.modelId === selectedModelId,
		);
		const nextModelId = selectedModelStillAvailable
			? selectedModelId
			: selectedProviderConfig.defaultModelId || selectedProviderConfig.availableModels[0]?.modelId || "";

		if (nextModelId !== selectedModelId) {
			setSelectedModelId(nextModelId);
		}
	}, [selectedModelId, selectedProviderConfig]);

	useEffect(() => {
		if (availableThinkingLevels.length === 0) {
			setSelectedThinkingLevel("");
			return;
		}

		const preferredThinkingLevel = selectedProviderConfig?.defaultThinkingLevel ?? availableThinkingLevels[0] ?? "";
		if (!availableThinkingLevels.includes(selectedThinkingLevel)) {
			setSelectedThinkingLevel(
				availableThinkingLevels.includes(preferredThinkingLevel)
					? preferredThinkingLevel
					: (availableThinkingLevels[0] ?? ""),
			);
		}
	}, [availableThinkingLevels, selectedProviderConfig?.defaultThinkingLevel, selectedThinkingLevel]);

	const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
		return localStorage.getItem("agentos_right_sidebar_collapsed") === "true";
	});
	const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
		return parseInt(localStorage.getItem("agentos_right_sidebar_width") || "256", 10);
	});
	const [isRightDragging, setIsRightDragging] = useState(false);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isRightDragging) return;
			let newWidth = window.innerWidth - e.clientX;
			if (newWidth < 200) newWidth = 200;
			if (newWidth > 600) newWidth = 600;
			setRightSidebarWidth(newWidth);
		};

		const handleMouseUp = () => {
			if (isRightDragging) {
				setIsRightDragging(false);
				localStorage.setItem("agentos_right_sidebar_width", rightSidebarWidth.toString());
			}
		};

		if (isRightDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
		} else {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isRightDragging, rightSidebarWidth]);

	const handleToggleRightCollapse = () => {
		const newCollapsed = !isRightCollapsed;
		setIsRightCollapsed(newCollapsed);
		localStorage.setItem("agentos_right_sidebar_collapsed", newCollapsed.toString());
	};

	return (
		<div className="flex-1 flex overflow-hidden bg-theme-base">
			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Header */}
				<div className="h-16 border-b border-theme-border flex items-center px-6 sticky top-0 bg-theme-surface z-10 flex-shrink-0">
					<h2 className="text-sm font-bold tracking-wide text-theme-text">
						{isNewChat ? t("layout.newChat") : session?.sessionName || "Chat"}
					</h2>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
					{isNewChat && messages.length === 0 ? (
						<div className="flex-1 flex flex-col items-center justify-center text-theme-text-secondary h-full min-h-[300px]">
							<div className="w-16 h-16 rounded-full bg-theme-surface-active flex items-center justify-center mb-6">
								<MessageSquare className="w-8 h-8 text-theme-text-muted" />
							</div>
							<h3 className="text-xl font-serif mb-2 text-theme-text">{t("projectDetail.chatPlaceholder")}</h3>
							<p className="max-w-md text-center text-sm">
								{t(
									"chat.newChatDesc",
									"Welcome to AgentOS. Send a message to start a new chat, or pick a skill/connector from the right sidebar to start working.",
								)}
							</p>
						</div>
					) : (
						messages.map((msg: MessageEntry) => {
							const textContent = msg.content.find((c) => c.type === "text")?.text || "";
							const isUser = msg.messageType === "user";
							return (
								<div key={msg.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
									{isUser ? (
										<div className="bg-theme-surface-hover text-theme-text border border-theme-border px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm whitespace-pre-wrap">
											{textContent}
										</div>
									) : (
										<div className="flex gap-4 max-w-[80%] w-full">
											<div className="w-8 h-8 rounded bg-theme-surface-active flex-shrink-0 flex items-center justify-center">
												<svg
													className="w-4 h-4 text-theme-accent"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
													></path>
												</svg>
											</div>
											<div className="flex flex-col gap-2 w-full min-w-0">
												<AgentMessage
													message={{
														content: textContent,
														processSteps: msg.processSteps || [],
														processStatus: msg.processStatus,
													}}
												/>
											</div>
										</div>
									)}
								</div>
							);
						})
					)}

					{session?.status === "running" &&
						!hasWorkingAssistant &&
						messages.length > 0 &&
						messages[messages.length - 1].messageType === "user" && (
							<div className="flex w-full justify-start">
								<div className="flex gap-4 max-w-[80%] w-full">
									<div className="w-8 h-8 rounded bg-theme-surface-active flex-shrink-0 flex items-center justify-center">
										<svg className="w-4 h-4 text-theme-accent animate-spin" fill="none" viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									</div>
									<div className="flex flex-col gap-2 justify-center">
										<div className="bg-theme-surface-hover text-theme-text-muted px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm opacity-70 animate-pulse">
											{t("chat.processWorking", "working")}...
										</div>
									</div>
								</div>
							</div>
						)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="p-6 border-t border-theme-border bg-theme-surface flex-shrink-0">
					{isNewChat && (
						<div className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-3 items-center text-xs text-theme-text-secondary">
							<span className="uppercase tracking-widest">{t("chat.provider")}</span>
							<CustomSelect
								value={selectedProviderConfigId}
								onChange={setSelectedProviderConfigId}
								className="min-w-56 bg-theme-surface-hover border border-theme-border rounded-full px-4 py-2 text-sm text-theme-text"
								options={
									hasProviderConfigs
										? providerConfigs
												.filter((providerConfig) => providerConfig.enabled)
												.map((providerConfig) => ({
													value: providerConfig.providerConfigId,
													label: providerConfig.displayName,
												}))
										: [
												{
													value: "",
													label: providersLoading
														? t("settings.loadingProviders")
														: t("chat.noProvidersConfigured"),
												},
											]
								}
							/>
							<span className="uppercase tracking-widest">{t("chat.model")}</span>
							<CustomSelect
								value={selectedModelId}
								onChange={setSelectedModelId}
								className="min-w-40 bg-theme-surface-hover border border-theme-border rounded-full px-4 py-2 text-sm text-theme-text"
								options={
									selectedProviderConfig
										? selectedProviderConfig.availableModels.map((availableModel) => ({
												value: availableModel.modelId,
												label: availableModel.displayName,
											}))
										: [{ value: "", label: t("chat.noProvidersConfigured") }]
								}
							/>
							{availableThinkingLevels.length > 0 && (
								<>
									<span className="uppercase tracking-widest">{t("chat.thinkingLevel")}</span>
									<CustomSelect
										value={selectedThinkingLevel}
										onChange={setSelectedThinkingLevel}
										className="min-w-40 bg-theme-surface-hover border border-theme-border rounded-full px-4 py-2 text-sm text-theme-text"
										options={availableThinkingLevels.map((thinkingLevel) => ({
											value: thinkingLevel,
											label: thinkingLevel,
										}))}
									/>
								</>
							)}
						</div>
					)}
					<div className="relative flex items-center max-w-4xl mx-auto">
						<button className="absolute left-4 text-theme-text-secondary hover:text-theme-accent transition-colors">
							<Plus className="w-5 h-5 flex-shrink-0" />
						</button>

						<input
							type="text"
							value={inputVal}
							onChange={(e) => setInputVal(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									if (inputVal.trim() && !isLoading && (!isNewChat || selectedProviderConfigId.length > 0)) {
										sendMessage(inputVal.trim(), chatId, {
											providerConfigId: selectedProviderConfigId,
											modelId: selectedModelId || undefined,
											thinkingLevel: selectedThinkingLevel || undefined,
										});
										setInputVal("");
									}
								}
							}}
							placeholder={
								isNewChat && !hasProviderConfigs
									? t("chat.configureProviderPlaceholder")
									: t("chat.messagePlaceholder")
							}
							disabled={isLoading || (isNewChat && !hasProviderConfigs)}
							className="w-full bg-theme-surface-hover border border-theme-border rounded-full py-3 px-12 text-sm text-theme-text focus:outline-none focus:border-theme-accent/50 placeholder-theme-text-muted transition-colors disabled:opacity-50"
						/>

						<div className="absolute right-4 flex items-center gap-2">
							<button
								onClick={() => setIsRecording(!isRecording)}
								className={cn(
									"text-theme-text-secondary hover:text-theme-accent transition-colors",
									isRecording && "text-red-500 animate-pulse",
								)}
							>
								<Mic className="w-5 h-5 flex-shrink-0" />
							</button>
							<button
								onClick={() => {
									if (inputVal.trim() && !isLoading && (!isNewChat || selectedProviderConfigId.length > 0)) {
										sendMessage(inputVal.trim(), chatId, {
											providerConfigId: selectedProviderConfigId,
											modelId: selectedModelId || undefined,
											thinkingLevel: selectedThinkingLevel || undefined,
										});
										setInputVal("");
									}
								}}
								disabled={isLoading || !inputVal.trim() || (isNewChat && !hasProviderConfigs)}
								className="text-theme-accent hover:text-theme-text transition-colors disabled:opacity-50"
							>
								<Send className="w-5 h-5 flex-shrink-0 ml-1" />
							</button>
						</div>
					</div>

					<div className="flex justify-center mt-3 h-4">
						{isRecording && (
							<span className="text-[9px] uppercase tracking-[0.2em] text-theme-accent animate-pulse">
								{t("chat.audioInputMode")}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Right Sidebar: Sub-Agents (Conditional or persistent) */}
			<div
				className={cn(
					"relative border-l border-theme-border bg-theme-surface flex flex-col flex-shrink-0 z-10",
					!isRightDragging && "transition-all duration-300 ease-in-out",
				)}
				style={{
					width: isRightCollapsed ? 64 : rightSidebarWidth,
				}}
			>
				<div className="h-16 border-b border-theme-border flex items-center justify-between px-4 w-full relative flex-shrink-0">
					{!isRightCollapsed && (
						<h3 className="text-[11px] uppercase tracking-widest text-theme-accent font-bold truncate">
							{t("chat.subAgentSwarm")}
						</h3>
					)}

					<button
						onClick={handleToggleRightCollapse}
						className={cn(
							"p-1.5 rounded-lg text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-active transition-colors flex items-center justify-center",
							isRightCollapsed && "mx-auto w-full",
						)}
						title={isRightCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{isRightCollapsed ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
					</button>
				</div>

				{!isRightCollapsed ? (
					<div className="flex-1 overflow-auto p-4 space-y-6">
						{SUB_AGENTS.map((agent) => (
							<div key={agent.id} className="space-y-2">
								<div className="flex justify-between items-center">
									<span className="text-xs font-medium text-theme-text">{agent.name}</span>
									<span
										className={cn(
											"text-[10px] font-bold uppercase",
											agent.status === "completed"
												? "text-emerald-500"
												: agent.status === "in-progress"
													? "text-theme-accent"
													: "text-theme-text-secondary",
										)}
									>
										{agent.status === "completed"
											? t("chat.active")
											: agent.status === "in-progress"
												? t("chat.active")
												: t("chat.statusPending")}
									</span>
								</div>

								<div className="w-full bg-theme-surface-hover h-1 rounded-full overflow-hidden">
									<div
										className={cn(
											"h-full transition-all duration-500 bg-theme-accent",
											agent.status === "completed" && "bg-emerald-500",
											agent.status === "pending" && "bg-theme-surface-active",
										)}
										style={{ width: `${agent.progress}%` }}
									/>
								</div>
								<div className="text-[10px] text-theme-text-secondary">
									{agent.status === "completed"
										? t("chat.statusCompleted")
										: agent.status === "in-progress"
											? t("chat.statusInProgress")
											: t("chat.statusPending")}
								</div>
							</div>
						))}

						<div className="p-4 bg-theme-surface-hover rounded border border-theme-border space-y-3 mt-8">
							<h4 className="text-[10px] uppercase tracking-widest text-theme-text-secondary">
								{t("chat.swarmStatistics")}
							</h4>
							<div className="grid grid-cols-2 gap-2">
								<div className="text-center py-2 bg-theme-surface rounded border border-theme-border">
									<div className="text-lg font-serif italic text-theme-accent">03</div>
									<div className="text-[8px] uppercase tracking-tighter text-theme-text-secondary">
										{t("chat.active")}
									</div>
								</div>
								<div className="text-center py-2 bg-theme-surface rounded border border-theme-border">
									<div className="text-lg font-serif italic text-theme-accent">00</div>
									<div className="text-[8px] uppercase tracking-tighter text-theme-text-secondary">
										{t("chat.errors")}
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 flex flex-col items-center py-4 gap-4 overflow-y-auto">
						{SUB_AGENTS.map((agent) => (
							<div
								key={agent.id}
								className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
								style={{
									borderColor:
										agent.status === "completed"
											? "#10b981"
											: agent.status === "in-progress"
												? "var(--accent-color)"
												: "var(--border-muted)",
									background: "var(--bg-surface-active)",
								}}
								title={`${agent.name} - ${agent.status}`}
							>
								<div
									className={cn(
										"w-2 h-2 rounded-full",
										agent.status === "completed" && "bg-emerald-500",
										agent.status === "in-progress" && "bg-theme-accent",
										agent.status === "pending" && "bg-theme-text-muted",
									)}
								/>
							</div>
						))}
					</div>
				)}

				{!isRightCollapsed && (
					<div
						className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-theme-accent/50 active:bg-theme-accent transition-colors z-30"
						onMouseDown={(e) => {
							setIsRightDragging(true);
							e.preventDefault();
						}}
					/>
				)}
			</div>
		</div>
	);
}
