import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Plus, Zap, Filter, Search, Calendar } from "lucide-react";
import { useScheduledTasks } from "../hooks/useScheduledTasks";
import { DUMMY_PROJECTS } from "../data/dummy";
import { TaskDialog } from "../components/TaskDialog";
import { ScheduledTask } from "../types";

import { CustomSelect } from "../components/CustomSelect";

export function AutomationPage() {
  const { t } = useTranslation();
  const { tasks: allTasks, setTasks } = useScheduledTasks();

  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  const filteredTasks = allTasks.filter((task) => {
    if (filterProject !== "all" && task.projectId !== filterProject)
      return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (
      searchQuery &&
      !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-theme-base overflow-hidden relative">
      {/* Background Graphic */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-theme-surface to-transparent opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="h-16 flex items-center px-6 gap-3 text-lg font-serif italic text-theme-accent border-b border-theme-border flex-shrink-0 relative z-10 bg-theme-base/80 backdrop-blur">
        <Zap className="w-5 h-5 text-theme-accent" />
        {t("layout.automation", "Automation")}
      </div>

      <div className="flex-1 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-serif italic text-theme-accent tracking-tight mb-2">
                {t("automation.title", "Tasks")}
              </h1>
              <p className="text-sm text-theme-text-secondary max-w-xl">
                Create and manage automated and scheduled jobs that run your
                prompts in the background.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskDialogOpen(true);
              }}
              className="flex items-center gap-2 bg-theme-accent text-theme-base px-4 py-2 rounded-lg font-medium hover:brightness-110 transition-all shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              {t("projectDetail.createTask", "Create Task")}
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 bg-theme-surface border border-theme-border rounded-xl p-2 shadow-sm">
            <div className="flex items-center gap-2 flex-1 px-3 w-full">
              <Search className="w-4 h-4 text-theme-text-secondary" />
              <input
                type="text"
                placeholder={t("automation.search", "Search tasks...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-theme-text placeholder:text-theme-text-muted w-full"
              />
            </div>
            <div className="w-px h-6 bg-theme-border/50 hidden md:block"></div>
            <div className="flex items-center gap-4 w-full md:w-auto px-3 border-t md:border-0 border-theme-border/50 pt-2 md:pt-0">
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={filterProject}
                  onChange={setFilterProject}
                  className="bg-transparent text-theme-text text-sm hover:text-theme-text transition-colors"
                  dropdownClassName="min-w-[150px]"
                  icon={
                    <Filter className="w-4 h-4 text-theme-text-secondary" />
                  }
                  options={[
                    {
                      value: "all",
                      label: t("automation.allProjects", "All Projects"),
                    },
                    ...DUMMY_PROJECTS.map((p) => ({
                      value: p.id,
                      label: p.name,
                    })),
                  ]}
                />
              </div>
              <div className="w-px h-6 bg-theme-border/50"></div>
              <CustomSelect
                value={filterStatus}
                onChange={setFilterStatus}
                className="bg-transparent text-theme-text text-sm hover:text-theme-text transition-colors"
                options={[
                  {
                    value: "all",
                    label: t("automation.allStatuses", "All Statuses"),
                  },
                  {
                    value: "active",
                    label: t("projectDetail.statusActive", "Active"),
                  },
                  {
                    value: "paused",
                    label: t("projectDetail.statusPaused", "Paused"),
                  },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full border border-dashed border-theme-border rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-theme-surface/50">
                <div className="w-16 h-16 bg-theme-surface-active rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Clock className="w-8 h-8 text-theme-text-secondary opacity-50" />
                </div>
                <h3 className="text-xl font-serif italic text-theme-text mb-2">
                  {t("automation.noTasks", "No tasks found")}
                </h3>
                <p className="text-theme-text-secondary max-w-md">
                  {t(
                    "automation.noTasksDesc",
                    "Try adjusting your filters or create a new task in a project.",
                  )}
                </p>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskDialogOpen(true);
                  }}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-surface-hover hover:border-theme-accent/30 text-theme-text transition-all font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {t("projectDetail.createTask", "Create Task")}
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const project = DUMMY_PROJECTS.find(
                  (p) => p.id === task.projectId,
                );
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setEditingTask(task);
                      setIsTaskDialogOpen(true);
                    }}
                    className="group bg-theme-surface border border-theme-border rounded-2xl p-5 hover:border-theme-accent/50 hover:shadow-md hover:shadow-theme-accent/5 transition-all cursor-pointer flex flex-col relative overflow-hidden h-56"
                  >
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3
                        className="font-medium text-theme-text text-base line-clamp-1 leading-tight group-hover:text-theme-accent transition-colors"
                        title={task.name}
                      >
                        {task.name || "Untitled Task"}
                      </h3>
                      <div
                        className={`px-3 py-1 flex items-center justify-center rounded text-[10px] uppercase font-bold tracking-wider flex-shrink-0 cursor-pointer transition-colors ${
                          task.status === "active"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
                            : "bg-theme-surface-hover text-theme-text-secondary border border-theme-border hover:border-theme-text-muted"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTasks(
                            allTasks.map((t) =>
                              t.id === task.id
                                ? {
                                    ...t,
                                    status:
                                      task.status === "active"
                                        ? "paused"
                                        : "active",
                                  }
                                : t,
                            ),
                          );
                        }}
                      >
                        {task.status === "active"
                          ? t("projectDetail.statusActive", "Active")
                          : t("projectDetail.statusPaused", "Paused")}
                      </div>
                    </div>

                    <p
                      className="text-sm text-theme-text-secondary line-clamp-3 mb-auto"
                      title={task.content}
                    >
                      {task.content || (
                        <span className="italic opacity-50">
                          No prompt content
                        </span>
                      )}
                    </p>

                    <div className="mt-4 pt-4 border-t border-theme-border flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-theme-text-secondary font-mono bg-theme-surface-active px-2 py-1 rounded">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>
                          {t(
                            `projectDetail.schedule${task.scheduleType}`,
                            task.scheduleType,
                          )}
                        </span>
                        <span className="opacity-50 mx-0.5">•</span>
                        <span className="truncate">
                          {task.time.replace("T", " ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-theme-accent/80 font-medium truncate min-w-0 pr-2">
                          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {project?.name || "Unknown Project"}
                          </span>
                        </div>
                        <div className="text-[10px] text-theme-text-muted px-1.5 py-0.5 bg-theme-base rounded border border-theme-border flex-shrink-0">
                          {task.model}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        editingTask={editingTask}
        onSave={(newTask) => {
          if (editingTask) {
            setTasks(
              allTasks.map((t) => (t.id === editingTask.id ? newTask : t)),
            );
          } else {
            setTasks([...allTasks, newTask]);
          }
          setIsTaskDialogOpen(false);
        }}
        onDelete={(taskId) => {
          setTasks(allTasks.filter((t) => t.id !== taskId));
          setIsTaskDialogOpen(false);
        }}
      />
    </div>
  );
}
