import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api-base-url";
import type {
	LlmProviderConfig,
	LlmProviderOAuthFlow,
	LlmProviderOAuthStartRequest,
	LlmProviderTypeCatalogItem,
	UpsertLlmProviderConfigRequest,
} from "../types";

const API_BASE_URL = getApiBaseUrl();

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		credentials: "include",
		...init,
		headers: {
			"content-type": "application/json",
			...(init?.headers ?? {}),
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText || `request failed: ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};

/**
 * Backend-backed provider-registry hook for settings and chat model selection.
 *
 * This replaces the old localStorage-only model settings so all LLM execution
 * paths read the same durable provider registry from managed-agent-api.
 */
export function useModelConfigs() {
	const [providerTypes, setProviderTypes] = useState<LlmProviderTypeCatalogItem[]>([]);
	const [configs, setConfigs] = useState<LlmProviderConfig[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		try {
			const [types, configsResponse] = await Promise.all([
				fetchJson<LlmProviderTypeCatalogItem[]>("/llm-provider-types"),
				fetchJson<LlmProviderConfig[]>("/me/llm-providers"),
			]);
			setProviderTypes(types);
			setConfigs(configsResponse);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const createConfig = useCallback(async (input: UpsertLlmProviderConfigRequest) => {
		const createdConfig = await fetchJson<LlmProviderConfig>("/me/llm-providers", {
			method: "POST",
			body: JSON.stringify(input),
		});
		setConfigs((previousConfigs) => [createdConfig, ...previousConfigs]);
		return createdConfig;
	}, []);

	const updateConfig = useCallback(
		async (providerConfigId: string, input: Partial<UpsertLlmProviderConfigRequest>) => {
			const updatedConfig = await fetchJson<LlmProviderConfig>(
				`/me/llm-providers/${encodeURIComponent(providerConfigId)}`,
				{
					method: "PATCH",
					body: JSON.stringify(input),
				},
			);
			setConfigs((previousConfigs) =>
				previousConfigs.map((config) => (config.providerConfigId === providerConfigId ? updatedConfig : config)),
			);
			return updatedConfig;
		},
		[],
	);

	const deleteConfig = useCallback(async (providerConfigId: string) => {
		await fetchJson<void>(`/me/llm-providers/${encodeURIComponent(providerConfigId)}`, {
			method: "DELETE",
		});
		setConfigs((previousConfigs) => previousConfigs.filter((config) => config.providerConfigId !== providerConfigId));
	}, []);

	const validateConfig = useCallback(async (providerConfigId: string) => {
		return fetchJson<{ providerConfigId: string; valid: boolean; errors: string[] }>(
			`/me/llm-providers/${encodeURIComponent(providerConfigId)}/validate`,
			{
				method: "POST",
			},
		);
	}, []);

	const startOAuthFlow = useCallback(async (providerConfigId: string, input: LlmProviderOAuthStartRequest = {}) => {
		return fetchJson<LlmProviderOAuthFlow>(`/me/llm-providers/${encodeURIComponent(providerConfigId)}/oauth/start`, {
			method: "POST",
			body: JSON.stringify(input),
		});
	}, []);

	const getOAuthFlow = useCallback(async (providerConfigId: string, flowId: string) => {
		return fetchJson<LlmProviderOAuthFlow>(
			`/me/llm-providers/${encodeURIComponent(providerConfigId)}/oauth/flows/${encodeURIComponent(flowId)}`,
		);
	}, []);

	const deleteOAuthCredential = useCallback(async (providerConfigId: string) => {
		const updatedConfig = await fetchJson<LlmProviderConfig>(
			`/me/llm-providers/${encodeURIComponent(providerConfigId)}/oauth-account`,
			{
				method: "DELETE",
			},
		);
		setConfigs((previousConfigs) =>
			previousConfigs.map((config) => (config.providerConfigId === providerConfigId ? updatedConfig : config)),
		);
		return updatedConfig;
	}, []);

	return {
		providerTypes,
		configs,
		isLoading,
		refresh,
		createConfig,
		updateConfig,
		deleteConfig,
		validateConfig,
		startOAuthFlow,
		getOAuthFlow,
		deleteOAuthCredential,
	};
}
