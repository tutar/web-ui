import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Moon,
  Sun,
  Settings as GeneralIcon,
  Cpu,
  Key,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  useModelConfigs,
  AVAILABLE_PROVIDERS,
  ModelProviderConfig,
} from "../hooks/useModelConfigs";
import { CustomSelect } from "./CustomSelect";

export function SettingsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"general" | "models">("general");
  const { configs, setConfigs } = useModelConfigs();

  const [editingConfig, setEditingConfig] =
    useState<ModelProviderConfig | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("light")) {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }, [isOpen]);

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const resetForm = () => {
    setEditingConfig(null);
    setIsFormOpen(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    if (configs.find((c) => c.id === editingConfig.id)) {
      setConfigs(
        configs.map((c) => (c.id === editingConfig.id ? editingConfig : c)),
      );
    } else {
      setConfigs([...configs, editingConfig]);
    }
    resetForm();
  };

  const handleCreateNew = () => {
    setEditingConfig({
      id: Math.random().toString(36).substring(2, 9),
      providerType: AVAILABLE_PROVIDERS[0].id,
      name: AVAILABLE_PROVIDERS[0].name,
      models: AVAILABLE_PROVIDERS[0].defaultModels,
      apiKey: "",
    });
    setIsFormOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-theme-surface border border-theme-border rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden text-theme-text transition-colors flex flex-col md:flex-row h-[80vh] max-h-[600px]">
        {/* Sidebar */}
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
              <GeneralIcon className="w-4 h-4" />
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

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-theme-base">
          <div className="flex justify-end p-4 border-b border-theme-border">
            <button
              onClick={onClose}
              className="text-theme-text-secondary hover:text-theme-text transition-colors rounded p-1 hover:bg-theme-surface-active"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {activeTab === "general" && (
              <div className="max-w-md space-y-8">
                <div>
                  <h3 className="text-lg font-serif italic text-theme-accent mb-6">
                    {t("settings.general")}
                  </h3>
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
              <div className="max-w-2xl space-y-8 pb-8">
                <div>
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <h3 className="text-lg font-serif italic text-theme-accent">
                      {t("settings.modelManagement")}
                    </h3>
                    {!isFormOpen && (
                      <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-4 py-2 bg-theme-accent text-theme-base rounded-lg text-sm font-medium hover:brightness-110 transition-all flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        {t("settings.addProvider")}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-theme-text-secondary">
                    {t("settings.modelManagementDesc")}
                  </p>
                </div>

                {isFormOpen && editingConfig ? (
                  <form
                    onSubmit={handleSaveConfig}
                    className="bg-theme-surface border border-theme-border rounded-xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4"
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-theme-border/50">
                      <div className="w-8 h-8 rounded bg-theme-accent/10 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-theme-accent" />
                      </div>
                      <h4 className="font-medium text-theme-text flex-1">
                        {configs.find((c) => c.id === editingConfig.id)
                          ? t("settings.editProvider")
                          : t("settings.addProvider")}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-theme-text-secondary">
                          {t("settings.provider")}
                        </label>
                        <CustomSelect
                          value={editingConfig.providerType}
                          onChange={(val) => {
                            const newProvider = AVAILABLE_PROVIDERS.find(
                              (p) => p.id === val,
                            );
                            if (newProvider) {
                              setEditingConfig({
                                ...editingConfig,
                                providerType: newProvider.id,
                                name: newProvider.name,
                                models: newProvider.defaultModels,
                              });
                            }
                          }}
                          className="w-full bg-theme-base border border-theme-border focus:border-theme-accent/50 rounded-lg px-4 py-2.5 text-sm outline-none text-theme-text transition-colors"
                          options={AVAILABLE_PROVIDERS.map((p) => ({
                            value: p.id,
                            label: p.name,
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-theme-text-secondary">
                          {t("settings.availableModels")}
                        </label>
                        <input
                          type="text"
                          value={editingConfig.models}
                          onChange={(e) =>
                            setEditingConfig({
                              ...editingConfig,
                              models: e.target.value,
                            })
                          }
                          className="w-full bg-theme-base border border-theme-border focus:border-theme-accent/50 rounded-lg px-4 py-2.5 text-sm outline-none text-theme-text transition-colors placeholder:text-theme-text-muted"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-theme-text-secondary flex items-center gap-1.5">
                          <Key className="w-3 h-3" />
                          {t("settings.apiKey")}
                        </label>
                        <input
                          type="password"
                          value={editingConfig.apiKey}
                          onChange={(e) =>
                            setEditingConfig({
                              ...editingConfig,
                              apiKey: e.target.value,
                            })
                          }
                          placeholder={t("settings.apiKeyPlaceholder")}
                          className="w-full bg-theme-base border border-theme-border focus:border-theme-accent/50 rounded-lg px-4 py-2.5 text-sm outline-none text-theme-text transition-colors placeholder:text-theme-text-muted"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-theme-border/50">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover transition-colors"
                      >
                        {t("settings.cancel")}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-theme-accent text-theme-base hover:brightness-110 transition-colors"
                      >
                        {t("settings.save")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-theme-text-secondary font-medium">
                      {t("settings.configuredProviders")}
                    </h4>

                    {configs.length === 0 ? (
                      <div className="border border-dashed border-theme-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <Cpu className="w-8 h-8 text-theme-text-secondary/50 mb-3" />
                        <p className="text-sm text-theme-text-secondary">
                          {t("settings.noProviders")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {configs.map((config) => (
                          <div
                            key={config.id}
                            className="bg-theme-surface border border-theme-border rounded-xl p-4 flex items-center gap-4 group hover:border-theme-accent/30 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-theme-surface-active flex items-center justify-center border border-theme-border flex-shrink-0">
                              <Cpu className="w-5 h-5 text-theme-accent/80" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm text-theme-text truncate">
                                {config.name}
                              </h5>
                              <p
                                className="text-xs text-theme-text-secondary truncate mt-0.5"
                                title={config.models}
                              >
                                {config.models.split(",").length} models
                                configured
                              </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingConfig(config);
                                  setIsFormOpen(true);
                                }}
                                className="p-2 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-theme-accent transition-colors"
                                title={t("settings.editProvider")}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this provider configuration?",
                                    )
                                  ) {
                                    setConfigs(
                                      configs.filter((c) => c.id !== config.id),
                                    );
                                  }
                                }}
                                className="p-2 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-red-500 transition-colors"
                                title={t("settings.deleteProvider")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
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
