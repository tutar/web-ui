import { Cpu, Edit2, ExternalLink, Key, Loader2, Moon, Plus, Sun, Trash2, Unplug } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useModelConfigs } from "../hooks/useModelConfigs";
import { cn } from "../lib/utils";
import type { LlmProviderConfig, LlmProviderOAuthFlow, LlmProviderTypeCatalogItem } from "../types";
import { CustomSelect } from "./CustomSelect";

type EditableProviderForm = {
	providerConfigId?: string;
	providerType: string;
	displayName: string;
	baseUrl: string;
	availableModelsText: string;
	defaultModelId: string;
	defaultThinkingLevel: string;
	apiKey: string;
	headersText: string;
	enabled: boolean;
	hasStoredCredential: boolean;
};

const createFormFromCatalog = (catalogItem: LlmProviderTypeCatalogItem): EditableProviderForm => {
	return {
		providerType: catalogItem.providerType,
		displayName: catalogItem.displayName,
		baseUrl: "",
		availableModelsText: catalogItem.defaultModels.map((model) => model.modelId).join(", "),
		defaultModelId: catalogItem.defaultModels[0]?.modelId ?? "",
		defaultThinkingLevel: catalogItem.defaultThinkingLevel,
		apiKey: "",
		headersText: "",
		enabled: true,
		hasStoredCredential: false,
	};
};

const createFormFromConfig = (config: LlmProviderConfig): EditableProviderForm => {
	return {
		providerConfigId: config.providerConfigId,
		providerType: config.providerType,
		displayName: config.displayName,
		baseUrl: config.baseUrl ?? "",
		availableModelsText: config.availableModels.map((model) => model.modelId).join(", "),
		defaultModelId: config.defaultModelId,
		defaultThinkingLevel: config.defaultThinkingLevel,
		apiKey: "",
		headersText: Object.keys(config.headers).length > 0 ? JSON.stringify(config.headers, null, 2) : "",
		enabled: config.enabled,
		hasStoredCredential: config.hasStoredCredential,
	};
};

const parseHeaders = (headersText: string) => {
	if (headersText.trim().length === 0) {
		return undefined;
	}

	const parsedHeaders = JSON.parse(headersText) as Record<string, string>;
	return parsedHeaders;
};

/**
 * Settings dialog for theme/language plus per-user LLM provider registry CRUD.
 *
 * The models tab is intentionally backend-backed so browser settings, API
 * execution, and harness runtime all share one durable provider truth.
 */
export function SettingsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { t, i18n } = useTranslation();
	const [theme, setTheme] = useState<"dark" | "light">("dark");
	const [activeTab, setActiveTab] = useState<"general" | "models">("general");
	const {
		providerTypes,
		configs,
		isLoading,
		refresh,
		createConfig,
		updateConfig,
		deleteConfig,
		startOAuthFlow,
		getOAuthFlow,
		deleteOAuthCredential,
	} = useModelConfigs();
	const [editingConfig, setEditingConfig] = useState<EditableProviderForm | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [oauthFlows, setOauthFlows] = useState<Record<string, LlmProviderOAuthFlow>>({});

	useEffect(() => {
		if (document.documentElement.classList.contains("light")) {
			setTheme("light");
		} else {
			setTheme("dark");
		}
	}, []);

	const selectedProviderType = useMemo(
		() => providerTypes.find((providerType) => providerType.providerType === editingConfig?.providerType),
		[editingConfig?.providerType, providerTypes],
	);
	const apiKeyRequired =
		selectedProviderType?.secretFields.includes("apiKey") === true && editingConfig?.hasStoredCredential !== true;

	/**
	 * Renders the compact uppercase field labels used across the settings form.
	 *
	 * Required markers are explicit because browser-native `required` validation
	 * alone does not make the form contract visible before submit.
	 */
	const renderFieldLabel = (label: string, isRequired = false, icon?: React.ReactNode) => {
		return (
			<span className="text-[10px] uppercase tracking-widest text-theme-text-secondary flex items-center gap-1.5">
				{icon}
				{label}
				{isRequired ? <span className="text-theme-accent">*</span> : null}
			</span>
		);
	};

	const handleThemeChange = (newTheme: "dark" | "light") => {
		setTheme(newTheme);
		if (newTheme === "light") {
			document.documentElement.classList.add("light");
		} else {
			document.documentElement.classList.remove("light");
		}
	};

	const closeForm = () => {
		setEditingConfig(null);
		setIsFormOpen(false);
	};

	const openCreateForm = () => {
		if (providerTypes.length === 0) {
			return;
		}

		setEditingConfig(createFormFromCatalog(providerTypes[0]));
		setIsFormOpen(true);
	};

	const openEditForm = (config: LlmProviderConfig) => {
		setEditingConfig(createFormFromConfig(config));
		setIsFormOpen(true);
	};

	const handleProviderTypeChange = (providerType: string) => {
		if (!editingConfig) {
			return;
		}

		const providerCatalogItem = providerTypes.find((item) => item.providerType === providerType);
		if (!providerCatalogItem) {
			return;
		}

		setEditingConfig({
			...editingConfig,
			providerType,
			displayName: providerCatalogItem.displayName,
			availableModelsText: providerCatalogItem.defaultModels.map((model) => model.modelId).join(", "),
			defaultModelId: providerCatalogItem.defaultModels[0]?.modelId ?? "",
			defaultThinkingLevel: providerCatalogItem.defaultThinkingLevel,
			baseUrl: providerCatalogItem.baseUrlRequired ? editingConfig.baseUrl : "",
			apiKey: "",
		});
	};

	const handleSaveConfig = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!editingConfig) {
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				providerType: editingConfig.providerType,
				displayName: editingConfig.displayName,
				baseUrl: editingConfig.baseUrl || undefined,
				headers: parseHeaders(editingConfig.headersText),
				availableModels: editingConfig.availableModelsText
					.split(",")
					.map((modelId) => modelId.trim())
					.filter((modelId) => modelId.length > 0),
				defaultModelId: editingConfig.defaultModelId || undefined,
				defaultThinkingLevel: editingConfig.defaultThinkingLevel || undefined,
				enabled: editingConfig.enabled,
				apiKey: editingConfig.apiKey || undefined,
			};

			if (editingConfig.providerConfigId) {
				await updateConfig(editingConfig.providerConfigId, payload);
			} else {
				await createConfig(payload);
			}

			closeForm();
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "Failed to save provider config");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteConfig = async (providerConfigId: string) => {
		if (!window.confirm(t("settings.deleteProviderConfirm"))) {
			return;
		}

		try {
			await deleteConfig(providerConfigId);
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "Failed to delete provider config");
		}
	};

	const pollOAuthFlow = async (providerConfigId: string, flowId: string) => {
		const nextFlow = await getOAuthFlow(providerConfigId, flowId);
		setOauthFlows((currentFlows) => ({
			...currentFlows,
			[providerConfigId]: nextFlow,
		}));

		if (nextFlow.status === "pending") {
			window.setTimeout(() => {
				void pollOAuthFlow(providerConfigId, flowId);
			}, 1500);
			return;
		}

		if (nextFlow.status === "completed") {
			await refresh();
			return;
		}

		if (nextFlow.status === "failed") {
			window.alert(nextFlow.error ?? t("settings.oauthConnectFailed"));
		}
	};

	const handleConnectOAuth = async (config: LlmProviderConfig) => {
		try {
			const enterpriseUrl =
				config.providerType === "github-copilot"
					? (window.prompt(t("settings.githubEnterprisePrompt")) ?? "").trim() || undefined
					: undefined;

			const startedFlow = await startOAuthFlow(config.providerConfigId, { enterpriseUrl });
			setOauthFlows((currentFlows) => ({
				...currentFlows,
				[config.providerConfigId]: startedFlow,
			}));

			if (startedFlow.instructions) {
				window.alert(startedFlow.instructions);
			}

			const oauthWindow = window.open(
				startedFlow.authUrl,
				`oauth-${config.providerConfigId}`,
				"popup=yes,width=640,height=720",
			);
			if (!oauthWindow) {
				window.alert(`${t("settings.oauthPopupBlocked")}\n${startedFlow.authUrl}`);
			}

			await pollOAuthFlow(config.providerConfigId, startedFlow.flowId);
		} catch (error) {
			window.alert(error instanceof Error ? error.message : t("settings.oauthConnectFailed"));
		}
	};

	const handleDisconnectOAuth = async (config: LlmProviderConfig) => {
		if (!window.confirm(t("settings.oauthDisconnectConfirm"))) {
			return;
		}

		try {
			await deleteOAuthCredential(config.providerConfigId);
			setOauthFlows((currentFlows) => {
				const nextFlows = { ...currentFlows };
				delete nextFlows[config.providerConfigId];
				return nextFlows;
			});
		} catch (error) {
			window.alert(error instanceof Error ? error.message : t("settings.oauthDisconnectFailed"));
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-theme-surface border border-theme-border rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden text-theme-text transition-colors flex flex-col md:flex-row h-[80vh] max-h-[680px]">
				<div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-theme-border bg-theme-surface-hover/50 flex flex-col">
					<div className="px-6 py-5 border-b border-theme-border">
						<h2 className="text-sm font-bold uppercase tracking-widest text-theme-accent">
							{t("settings.title")}
						</h2>
					</div>
					<div className="p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
						<button
							onClick={() => setActiveTab("general")}
							className={cn(
								"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
								activeTab === "general"
									? "bg-theme-surface-active text-theme-text shadow-sm"
									: "text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover",
							)}
						>
							<Moon className="w-4 h-4" />
							{t("settings.general")}
						</button>
						<button
							onClick={() => setActiveTab("models")}
							className={cn(
								"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
								activeTab === "models"
									? "bg-theme-surface-active text-theme-text shadow-sm"
									: "text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover",
							)}
						>
							<Cpu className="w-4 h-4" />
							{t("settings.models")}
						</button>
					</div>
				</div>

				<div className="flex-1 flex flex-col overflow-hidden bg-theme-base">
					<div className="flex justify-end p-4 border-b border-theme-border">
						<button
							onClick={onClose}
							className="text-theme-text-secondary hover:text-theme-text transition-colors rounded p-1 hover:bg-theme-surface-active"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-6 md:p-8">
						{activeTab === "general" && (
							<div className="max-w-md space-y-8">
								<div>
									<h3 className="text-lg font-serif italic text-theme-accent mb-6">{t("settings.general")}</h3>
									<div className="space-y-4">
										<label className="block text-[10px] uppercase tracking-widest text-theme-text-secondary transition-colors">
											{t("settings.language")}
										</label>
										<div className="flex gap-3">
											<button
												onClick={() => i18n.changeLanguage("en")}
												className={`flex-1 py-2.5 rounded text-xs uppercase tracking-widest transition-colors font-medium border ${
													i18n.language.startsWith("en")
														? "bg-theme-accent text-white border-theme-accent"
														: "bg-theme-surface text-theme-text-secondary border-theme-border hover:border-theme-accent/50"
												}`}
											>
												English
											</button>
											<button
												onClick={() => i18n.changeLanguage("zh")}
												className={`flex-1 py-2.5 rounded text-xs uppercase tracking-widest transition-colors font-medium border ${
													i18n.language.startsWith("zh")
														? "bg-theme-accent text-white border-theme-accent"
														: "bg-theme-surface text-theme-text-secondary border-theme-border hover:border-theme-accent/50"
												}`}
											>
												中文
											</button>
										</div>
									</div>
								</div>

								<div className="pt-6 border-t border-theme-border">
									<div className="space-y-4">
										<label className="block text-[10px] uppercase tracking-widest text-theme-text-secondary transition-colors">
											{t("settings.theme")}
										</label>
										<div className="flex gap-3">
											<button
												onClick={() => handleThemeChange("dark")}
												className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded text-xs uppercase tracking-widest transition-colors font-medium border ${
													theme === "dark"
														? "bg-theme-accent text-white border-theme-accent"
														: "bg-theme-surface text-theme-text-secondary border-theme-border hover:border-theme-accent/50"
												}`}
											>
												<Moon className="w-4 h-4" />
												{t("settings.dark")}
											</button>
											<button
												onClick={() => handleThemeChange("light")}
												className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded text-xs uppercase tracking-widest transition-colors font-medium border ${
													theme === "light"
														? "bg-theme-accent text-white border-theme-accent"
														: "bg-theme-surface text-theme-text-secondary border-theme-border hover:border-theme-accent/50"
												}`}
											>
												<Sun className="w-4 h-4" />
												{t("settings.light")}
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						{activeTab === "models" && (
							<div className="max-w-3xl space-y-8 pb-8">
								<div>
									<div className="flex items-center justify-between mb-2 gap-4">
										<h3 className="text-lg font-serif italic text-theme-accent">
											{t("settings.modelManagement")}
										</h3>
										{!isFormOpen && (
											<button
												onClick={openCreateForm}
												className="flex items-center gap-2 px-4 py-2 bg-theme-accent text-theme-base rounded-lg text-sm font-medium hover:brightness-110 transition-all flex-shrink-0"
											>
												<Plus className="w-4 h-4" />
												{t("settings.addProvider")}
											</button>
										)}
									</div>
									<p className="text-sm text-theme-text-secondary">{t("settings.modelManagementDesc")}</p>
								</div>

								{isFormOpen && editingConfig && selectedProviderType ? (
									<form
										onSubmit={(event) => void handleSaveConfig(event)}
										className="bg-theme-surface border border-theme-border rounded-xl p-5 space-y-4 shadow-sm"
									>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<label>{renderFieldLabel(t("settings.provider"), true)}</label>
												<CustomSelect
													value={editingConfig.providerType}
													onChange={handleProviderTypeChange}
													className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
													options={providerTypes.map((providerType) => ({
														value: providerType.providerType,
														label: providerType.displayName,
													}))}
												/>
											</div>
											<div className="space-y-2">
												<label>{renderFieldLabel(t("settings.displayName"), true)}</label>
												<input
													type="text"
													value={editingConfig.displayName}
													onChange={(event) =>
														setEditingConfig((currentConfig) =>
															currentConfig
																? { ...currentConfig, displayName: event.target.value }
																: currentConfig,
														)
													}
													className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
													required
												/>
											</div>
										</div>

										{selectedProviderType.helpText && (
											<p className="text-xs text-theme-text-secondary">{selectedProviderType.helpText}</p>
										)}

										{selectedProviderType.supportsCustomBaseUrl && (
											<div className="space-y-2">
												<label>
													{renderFieldLabel(t("settings.baseUrl"), selectedProviderType.baseUrlRequired)}
												</label>
												<input
													type="text"
													value={editingConfig.baseUrl}
													onChange={(event) =>
														setEditingConfig((currentConfig) =>
															currentConfig
																? { ...currentConfig, baseUrl: event.target.value }
																: currentConfig,
														)
													}
													className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
													placeholder={
														selectedProviderType.baseUrlRequired ? "https://..." : t("settings.optional")
													}
													required={selectedProviderType.baseUrlRequired}
												/>
											</div>
										)}

										<div className="space-y-2">
											<label>{renderFieldLabel(t("settings.availableModels"), true)}</label>
											<input
												type="text"
												value={editingConfig.availableModelsText}
												onChange={(event) =>
													setEditingConfig((currentConfig) =>
														currentConfig
															? { ...currentConfig, availableModelsText: event.target.value }
															: currentConfig,
													)
												}
												className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
												required
											/>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<label>{renderFieldLabel(t("settings.defaultModel"), true)}</label>
												<input
													type="text"
													value={editingConfig.defaultModelId}
													onChange={(event) =>
														setEditingConfig((currentConfig) =>
															currentConfig
																? { ...currentConfig, defaultModelId: event.target.value }
																: currentConfig,
														)
													}
													className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
													required
												/>
											</div>
											<div className="space-y-2">
												<label>{renderFieldLabel(t("settings.defaultThinkingLevel"))}</label>
												<input
													type="text"
													value={editingConfig.defaultThinkingLevel}
													onChange={(event) =>
														setEditingConfig((currentConfig) =>
															currentConfig
																? { ...currentConfig, defaultThinkingLevel: event.target.value }
																: currentConfig,
														)
													}
													className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
												/>
											</div>
										</div>

										{selectedProviderType.secretFields.includes("apiKey") && (
											<div className="space-y-2">
												<label>
													{renderFieldLabel(
														t("settings.apiKey"),
														apiKeyRequired,
														<Key className="w-3 h-3" />,
													)}
												</label>
												<input
													type="password"
													value={editingConfig.apiKey}
													onChange={(event) =>
														setEditingConfig((currentConfig) =>
															currentConfig
																? { ...currentConfig, apiKey: event.target.value }
																: currentConfig,
														)
													}
													placeholder={t("settings.apiKeyPlaceholder")}
													className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text"
													required={apiKeyRequired}
												/>
												{editingConfig.hasStoredCredential ? (
													<p className="text-xs text-theme-text-secondary">
														{t("settings.apiKeyStoredHint")}
													</p>
												) : null}
											</div>
										)}

										{selectedProviderType.secretFields.includes("oauthCredential") && (
											<div className="rounded-lg border border-theme-border bg-theme-base px-4 py-3 text-sm text-theme-text-secondary">
												{t("settings.oauthManagedByBrowser")}
											</div>
										)}

										<div className="space-y-2">
											<label>{renderFieldLabel(t("settings.headersJson"))}</label>
											<textarea
												value={editingConfig.headersText}
												onChange={(event) =>
													setEditingConfig((currentConfig) =>
														currentConfig
															? { ...currentConfig, headersText: event.target.value }
															: currentConfig,
													)
												}
												className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2.5 text-sm text-theme-text min-h-28"
												placeholder='{"x-api-key":"..."}'
											/>
										</div>

										<div className="flex items-center gap-3">
											<input
												id="provider-enabled"
												type="checkbox"
												checked={editingConfig.enabled}
												onChange={(event) =>
													setEditingConfig((currentConfig) =>
														currentConfig
															? { ...currentConfig, enabled: event.target.checked }
															: currentConfig,
													)
												}
											/>
											<label htmlFor="provider-enabled" className="text-sm text-theme-text-secondary">
												{t("settings.enabled")}
											</label>
										</div>

										<div className="flex gap-3 justify-end pt-4 border-t border-theme-border/50">
											<button
												type="button"
												onClick={closeForm}
												className="px-4 py-2 rounded-lg text-sm font-medium text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover transition-colors"
											>
												{t("settings.cancel")}
											</button>
											<button
												type="submit"
												disabled={isSaving}
												className="px-4 py-2 rounded-lg text-sm font-medium bg-theme-accent text-theme-base hover:brightness-110 transition-colors disabled:opacity-60"
											>
												{isSaving ? t("settings.saving") : t("settings.save")}
											</button>
										</div>
									</form>
								) : (
									<div className="space-y-4">
										<h4 className="text-xs uppercase tracking-widest text-theme-text-secondary font-medium">
											{t("settings.configuredProviders")}
										</h4>

										{isLoading ? (
											<div className="text-sm text-theme-text-secondary">
												{t("settings.loadingProviders")}
											</div>
										) : configs.length === 0 ? (
											<div className="border border-dashed border-theme-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
												<Cpu className="w-8 h-8 text-theme-text-secondary/50 mb-3" />
												<p className="text-sm text-theme-text-secondary">{t("settings.noProviders")}</p>
											</div>
										) : (
											<div className="space-y-3">
												{configs.map((config) => {
													const oauthFlow = oauthFlows[config.providerConfigId];
													const isOauthProvider = config.authMode === "oauth";
													return (
														<div
															key={config.providerConfigId}
															className="bg-theme-surface border border-theme-border rounded-xl p-4 flex items-center gap-4 group hover:border-theme-accent/30 transition-colors"
														>
															<div className="w-10 h-10 rounded-lg bg-theme-surface-active flex items-center justify-center border border-theme-border flex-shrink-0">
																<Cpu className="w-5 h-5 text-theme-accent/80" />
															</div>

															<div className="flex-1 min-w-0">
																<h5 className="font-medium text-sm text-theme-text truncate">
																	{config.displayName}
																</h5>
																<p className="text-xs text-theme-text-secondary truncate mt-0.5">
																	{config.providerType} · {config.availableModels.length}{" "}
																	{t("settings.modelsCount")}
																</p>
																<p className="text-xs text-theme-text-secondary truncate mt-0.5">
																	{config.hasStoredCredential
																		? t("settings.credentialStored")
																		: t("settings.credentialMissing")}
																</p>
																{oauthFlow && (
																	<p className="text-xs text-theme-text-secondary truncate mt-0.5">
																		{oauthFlow.status === "pending"
																			? t("settings.oauthConnecting")
																			: oauthFlow.status === "completed"
																				? t("settings.oauthConnected")
																				: t("settings.oauthConnectFailed")}
																	</p>
																)}
															</div>

															<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																{isOauthProvider && (
																	<>
																		<button
																			onClick={() => void handleConnectOAuth(config)}
																			className="p-2 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-theme-accent transition-colors"
																			title={t("settings.connectProvider")}
																			disabled={oauthFlow?.status === "pending"}
																		>
																			{oauthFlow?.status === "pending" ? (
																				<Loader2 className="w-4 h-4 animate-spin" />
																			) : (
																				<ExternalLink className="w-4 h-4" />
																			)}
																		</button>
																		{config.hasStoredCredential && (
																			<button
																				onClick={() => void handleDisconnectOAuth(config)}
																				className="p-2 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-red-500 transition-colors"
																				title={t("settings.disconnectProvider")}
																			>
																				<Unplug className="w-4 h-4" />
																			</button>
																		)}
																	</>
																)}
																<button
																	onClick={() => openEditForm(config)}
																	className="p-2 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-theme-accent transition-colors"
																	title={t("settings.editProvider")}
																>
																	<Edit2 className="w-4 h-4" />
																</button>
																<button
																	onClick={() => void handleDeleteConfig(config.providerConfigId)}
																	className="p-2 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-red-500 transition-colors"
																	title={t("settings.deleteProvider")}
																>
																	<Trash2 className="w-4 h-4" />
																</button>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
