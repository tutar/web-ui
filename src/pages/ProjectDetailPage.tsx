import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Star,
  Plus,
  Settings,
  ChevronDown,
  Mic,
  FileText,
  Send,
  Archive,
  Trash,
  Clock,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DUMMY_CHATS, DUMMY_PROJECTS } from "../data/dummy";
import { cn } from "../lib/utils";
import { ScheduledTask } from "../types";
import { useScheduledTasks } from "../hooks/useScheduledTasks";
import { TaskDialog } from "../components/TaskDialog";

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const project =
    DUMMY_PROJECTS.find((p) => p.id === projectId) || DUMMY_PROJECTS[0];
  const [showMenu, setShowMenu] = useState(false);
  const { tasks: allTasks, setTasks } = useScheduledTasks();
  const tasks = allTasks.filter((t) => t.projectId === project.id);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  return (
    <div className="flex flex-col h-full bg-theme-base overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-6 gap-2 text-sm text-theme-text-secondary border-b border-theme-border bg-theme-surface flex-shrink-0">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 hover:text-theme-text transition-colors py-1 pl-1 pr-2 -ml-1 rounded hover:bg-theme-surface-hover"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-widest font-medium">
            {t("projectDetail.allProjects")}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Project Header */}
          <div className="flex items-start justify-between mb-8 pb-8 border-b border-theme-border">
            <div>
              <h1 className="text-3xl font-serif italic text-theme-accent tracking-tight mb-2">
                {project.name}
              </h1>
              <p className="text-theme-text-secondary text-sm">
                {project.description}
              </p>
            </div>

            <div className="flex items-center gap-2 relative">
              <button className="p-2 rounded hover:bg-theme-surface-hover text-theme-text-secondary hover:text-theme-accent transition-colors border border-transparent hover:border-theme-border">
                <Star className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded hover:bg-theme-surface-hover text-theme-text-secondary hover:text-theme-accent transition-colors border border-transparent hover:border-theme-border"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute top-10 right-0 w-48 bg-theme-surface-hover border border-theme-border rounded shadow-lg py-1 z-10">
                  <button className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest text-theme-text hover:bg-theme-surface-active flex items-center gap-3">
                    <Settings className="w-4 h-4 text-theme-accent" />{" "}
                    {t("projectDetail.editDetails")}
                  </button>
                  <button className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest text-theme-text hover:bg-theme-surface-active flex items-center gap-3">
                    <Archive className="w-4 h-4 text-theme-accent" />{" "}
                    {t("projectDetail.archive")}
                  </button>
                  <button className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/10 flex items-center gap-3">
                    <Trash className="w-4 h-4" /> {t("projectDetail.delete")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column (Chat Info) */}
            <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
              {/* Chat Input / Start */}
              <div className="bg-theme-surface-hover border border-theme-border rounded p-4 shadow-sm focus-within:border-theme-accent/50 transition-all">
                <textarea
                  placeholder={t("projectDetail.chatPlaceholder")}
                  className="w-full bg-transparent resize-none outline-none text-theme-text placeholder:text-theme-text-muted min-h-[60px] text-sm"
                />

                <div className="flex items-center justify-between mt-4">
                  <button className="p-1.5 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-theme-accent transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium text-theme-accent border border-theme-accent/30 hover:bg-theme-accent/10 rounded bg-theme-base transition-colors">
                      Sonnet 4.6 <ChevronDown className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-theme-surface-active text-theme-text-secondary hover:text-theme-accent transition-colors">
                      <Mic className="w-4 h-4" />
                    </button>
                    <button className="bg-theme-accent text-black p-1.5 rounded hover:opacity-90 transition-opacity ml-1">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat History List */}
              <div className="flex flex-col mt-4">
                <label className="text-[10px] uppercase tracking-widest text-theme-text-muted mb-4">
                  {t("projectDetail.recentConversations")}
                </label>
                {DUMMY_CHATS.map((chat, idx) => (
                  <div
                    key={chat.id}
                    className="p-3 bg-theme-surface-hover rounded border-l-2 border-transparent hover:border-theme-accent cursor-pointer group transition-colors mb-2"
                  >
                    <h4 className="font-medium text-theme-text text-sm truncate">
                      {chat.title}
                    </h4>
                    <p className="text-[10px] text-theme-text-secondary mt-1 group-hover:text-theme-text transition-colors">
                      {t("projectDetail.lastMessage")} {chat.lastMessageAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Instructions & Files) */}
            <div className="flex flex-col gap-4">
              {/* Instructions */}
              <div className="bg-theme-surface border border-theme-border rounded p-5">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-theme-accent">
                    {t("projectDetail.instructions")}
                  </h3>
                  <button className="text-theme-text-secondary hover:text-theme-accent transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                  {t("projectDetail.instructionsDesc")}
                </p>
              </div>

              {/* Knowledge Base (Files) */}
              <div className="bg-theme-surface border border-theme-border rounded p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-theme-accent">
                    {t("projectDetail.knowledgeBase")}
                  </h3>
                  <button className="text-theme-text-secondary hover:text-theme-accent transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-theme-surface-hover rounded border border-dashed border-theme-border-muted hover:border-theme-accent/50 transition-colors p-6 flex flex-col items-center justify-center min-h-[160px] text-center cursor-pointer group">
                  <div className="flex gap-2 mb-4 text-theme-text-muted group-hover:text-theme-accent transition-colors">
                    <FileText className="w-8 h-8" />
                    <FileText className="w-8 h-8 opacity-70" />
                    <FileText className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-[11px] text-theme-text-secondary px-2 leading-relaxed">
                    {t("projectDetail.knowledgeBaseDesc")}
                  </p>
                </div>
              </div>

              {/* Scheduled Tasks */}
              <div className="bg-theme-surface border border-theme-border rounded p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-theme-accent">
                    {t("projectDetail.scheduledTasks")}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                    className="text-theme-text-secondary hover:text-theme-accent transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div
                    className="bg-theme-surface-hover rounded border border-dashed border-theme-border-muted hover:border-theme-accent/50 transition-colors p-6 flex flex-col items-center justify-center text-center cursor-pointer group"
                    onClick={() => {
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                  >
                    <div className="flex gap-2 mb-4 text-theme-text-muted group-hover:text-theme-accent transition-colors">
                      <Clock className="w-8 h-8 opacity-70" />
                    </div>
                    <p className="text-[11px] text-theme-text-secondary px-2 leading-relaxed">
                      {t("projectDetail.noTasksDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setEditingTask(task);
                          setIsTaskDialogOpen(true);
                        }}
                        className="p-3 bg-theme-surface-hover rounded border border-theme-border hover:border-theme-accent cursor-pointer group transition-colors flex justify-between items-center"
                      >
                        <div className="flex flex-col gap-1 w-full overflow-hidden mr-2">
                          <span className="text-sm text-theme-text font-medium truncate block">
                            {task.name || "Untitled Task"}
                          </span>
                          <span className="text-[10px] text-theme-text-secondary uppercase tracking-wider">
                            {t(`projectDetail.schedule${task.scheduleType}`)} -{" "}
                            {task.time}
                          </span>
                        </div>
                        <div
                          className={`px-2 py-1 text-[10px] uppercase tracking-widest rounded flex-shrink-0 ${task.status === "active" ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}
                        >
                          {task.status === "active"
                            ? t("projectDetail.statusActive")
                            : t("projectDetail.statusPaused")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        editingTask={editingTask}
        defaultProjectId={project.id}
        onSave={(newTask: ScheduledTask) => {
          if (editingTask) {
            setTasks(allTasks.map((t) => (t.id === editingTask.id ? newTask : t)));
          } else {
            setTasks([...allTasks, newTask]);
          }
          setIsTaskDialogOpen(false);
        }}
        onDelete={(taskId: string) => {
          setTasks(allTasks.filter((t) => t.id !== taskId));
          setIsTaskDialogOpen(false);
        }}
      />
    </div>
  );
}
