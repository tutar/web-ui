import { useState, useEffect } from 'react';

export interface ModelProviderConfig {
  id: string;
  providerType: string;
  name: string;
  models: string;
  apiKey: string;
}

export const AVAILABLE_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultModels: 'gpt-4o, gpt-4-turbo, gpt-3.5-turbo' },
  { id: 'anthropic', name: 'Anthropic', defaultModels: 'claude-3-5-sonnet-20240620, claude-3-opus-20240229, claude-3-haiku-20240307' },
  { id: 'google', name: 'Google Gemini', defaultModels: 'gemini-1.5-pro, gemini-1.5-flash' },
  { id: 'xai', name: 'xAI', defaultModels: 'grok-2, grok-beta' },
  { id: 'deepseek', name: 'DeepSeek', defaultModels: 'deepseek-chat, deepseek-coder' },
];

const STORAGE_KEY = 'agentos_model_configs';

export function useModelConfigs() {
  const [configs, setConfigs] = useState<ModelProviderConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }, [configs]);

  return { configs, setConfigs };
}
