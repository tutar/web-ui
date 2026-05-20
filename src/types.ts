export interface ScheduledTask {
	id: string;
	name: string;
	content: string;
	scheduleType: "Once" | "Hourly" | "Daily" | "Weekly" | "Monthly";
	time: string; // ISO string for once, cron expression for periodic
	projectId: string;
	model: string;
	status: "active" | "paused";
}

export type CapabilityTier = "fast" | "balanced" | "strong";

export type ProviderAuthMode = "api_key" | "oauth" | "none";

export type OAuthCredentialMaterial = {
	access: string;
	refresh: string;
	expires: number;
	accountId?: string;
	enterpriseUrl?: string;
};

export type LlmProviderTypeCatalogItem = {
	providerType: string;
	displayName: string;
	authMode: ProviderAuthMode;
	runtimeProviderId: string;
	usesBuiltInProvider: boolean;
	apiType?: "openai-completions" | "openai-responses" | "anthropic-messages" | "google-generative-ai";
	supportsCustomBaseUrl: boolean;
	supportsCustomHeaders: boolean;
	baseUrlRequired: boolean;
	defaultModels: Array<{
		modelId: string;
		displayName: string;
		supportsReasoning: boolean;
	}>;
	defaultCapabilityModelIds: Partial<Record<CapabilityTier, string>>;
	defaultThinkingLevel: string;
	secretFields: Array<"apiKey" | "oauthCredential">;
	helpText?: string;
};

export type LlmProviderConfig = {
	providerConfigId: string;
	providerType: string;
	displayName: string;
	authMode: ProviderAuthMode;
	baseUrl?: string;
	headers: Record<string, string>;
	availableModels: Array<{
		modelId: string;
		displayName: string;
		supportsReasoning: boolean;
	}>;
	defaultModelId: string;
	fastModelId?: string;
	balancedModelId?: string;
	strongModelId?: string;
	defaultThinkingLevel: string;
	enabled: boolean;
	hasStoredCredential: boolean;
};

export type UpsertLlmProviderConfigRequest = {
	providerType: string;
	displayName?: string;
	baseUrl?: string;
	headers?: Record<string, string>;
	availableModels?: string[];
	defaultModelId?: string;
	fastModelId?: string;
	balancedModelId?: string;
	strongModelId?: string;
	defaultThinkingLevel?: string;
	enabled?: boolean;
	apiKey?: string;
	oauthCredential?: OAuthCredentialMaterial;
};

export type LlmProviderOAuthStartRequest = {
	enterpriseUrl?: string;
};

export type LlmProviderOAuthFlow = {
	flowId: string;
	status: "pending" | "completed" | "failed";
	authUrl?: string;
	instructions?: string;
	error?: string;
	expiresAt: number;
	completedAt?: string;
	usesManagedCallback: boolean;
};
