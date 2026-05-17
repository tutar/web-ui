import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DUMMY_PROJECTS } from "../data/dummy";
import type { ScheduledTask } from "../types";
import { CustomSelect } from "./CustomSelect";

interface TaskDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (task: ScheduledTask) => void;
	onDelete?: (taskId: string) => void;
	editingTask: ScheduledTask | null;
	defaultProjectId?: string;
}

export function TaskDialog({ isOpen, onClose, onSave, onDelete, editingTask, defaultProjectId }: TaskDialogProps) {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.currentTarget);
						const projectId = formData.get("projectId") as string;
						if (!projectId) return;

						const newTask: ScheduledTask = {
							id: editingTask?.id || Math.random().toString(36).substr(2, 9),
							name: formData.get("name") as string,
							content: formData.get("content") as string,
							scheduleType: formData.get("scheduleType") as ScheduledTask["scheduleType"],
							time: formData.get("time") as string,
							projectId: projectId,
							model: formData.get("model") as string,
							status: formData.get("status") as "active" | "paused",
						};

						onSave(newTask);
					}}
					className="flex flex-col flex-1 overflow-hidden"
				>
					<div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-base">
						<input
							type="text"
							name="name"
							defaultValue={editingTask?.name}
							placeholder={t("projectDetail.taskNamePlaceholder", "Enter task name...")}
							className="bg-transparent text-lg font-serif italic text-theme-accent outline-none flex-1 placeholder:text-theme-accent/50 mr-4"
							required
						/>
						<button
							type="button"
							onClick={onClose}
							className="text-theme-text-secondary hover:text-theme-text transition-colors p-1"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="flex flex-col overflow-y-auto">
						<div className="p-6 flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<label className="text-xs font-semibold uppercase tracking-widest text-theme-text-secondary">
									{t("projectDetail.taskContent", "Prompt Content")}
								</label>
								<div className="bg-theme-surface-hover border border-theme-border rounded p-4 flex flex-col focus-within:border-theme-accent/50 transition-all">
									<textarea
										name="content"
										defaultValue={editingTask?.content}
										placeholder={t("projectDetail.taskContentPlaceholder", "Enter prompt content to run...")}
										className="w-full bg-transparent resize-none outline-none text-theme-text placeholder:text-theme-text-muted min-h-[100px] text-sm"
										required
									/>

									<div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-theme-border/50">
										<div className="flex items-center gap-2 bg-theme-base border border-theme-border focus-within:border-theme-accent/50 rounded pr-2 text-[11px]">
											<CustomSelect
												name="scheduleType"
												defaultValue={editingTask?.scheduleType || "Once"}
												className="bg-transparent text-theme-text focus:outline-none py-1.5 pl-2 hover:text-theme-text transition-colors text-sm"
												dropdownClassName="min-w-[120px]"
												options={[
													{
														value: "Once",
														label: t("projectDetail.scheduleOnce", "Once"),
													},
													{
														value: "Hourly",
														label: t("projectDetail.scheduleHourly", "Hourly"),
													},
													{
														value: "Daily",
														label: t("projectDetail.scheduleDaily", "Daily"),
													},
													{
														value: "Weekly",
														label: t("projectDetail.scheduleWeekly", "Weekly"),
													},
													{
														value: "Monthly",
														label: t("projectDetail.scheduleMonthly", "Monthly"),
													},
												]}
											/>
											<span className="text-theme-text-muted">|</span>
											<input
												type="datetime-local"
												name="time"
												defaultValue={
													editingTask?.time ||
													new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
														.toISOString()
														.slice(0, 16)
												}
												className="bg-transparent text-theme-text focus:outline-none py-1.5"
												required
												style={{ colorScheme: "dark" }}
											/>
										</div>

										<CustomSelect
											name="projectId"
											defaultValue={editingTask?.projectId || defaultProjectId || DUMMY_PROJECTS[0]?.id}
											className="bg-theme-base border border-theme-border hover:border-theme-accent/50 rounded px-2 py-1.5 text-[11px] text-theme-text transition-colors max-w-[150px]"
											dropdownClassName="min-w-[150px]"
											options={DUMMY_PROJECTS.map((p) => ({
												value: p.id,
												label: p.name,
											}))}
										/>

										<CustomSelect
											name="model"
											defaultValue={editingTask?.model || "Sonnet 4.6"}
											className="bg-theme-base border border-theme-border hover:border-theme-accent/50 rounded px-2 py-1.5 text-[11px] text-theme-text transition-colors"
											dropdownClassName="min-w-[120px]"
											options={[
												{ value: "Sonnet 4.6", label: "Sonnet 4.6" },
												{ value: "Opus", label: "Opus" },
												{ value: "Haiku", label: "Haiku" },
												{ value: "GPT-4o", label: "GPT-4o" },
											]}
										/>

										<CustomSelect
											name="status"
											defaultValue={editingTask?.status || "active"}
											className="bg-theme-base border border-theme-border hover:border-theme-accent/50 rounded px-2 py-1.5 text-[11px] text-theme-text transition-colors"
											dropdownClassName="min-w-[100px]"
											options={[
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
							</div>
						</div>
					</div>

					<div className="px-6 py-4 border-t border-theme-border bg-theme-base flex justify-end gap-3 mt-auto">
						{editingTask && onDelete && (
							<button
								type="button"
								onClick={() => onDelete(editingTask.id)}
								className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded transition-colors mr-auto border border-transparent"
							>
								{t("projectDetail.deleteTask", "Delete Task")}
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text transition-colors border border-transparent"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm bg-theme-accent text-theme-base rounded hover:brightness-110 transition-all font-medium border border-transparent"
						>
							{editingTask
								? t("projectDetail.saveChanges", "Save Changes")
								: t("projectDetail.createTask", "Create Task")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
