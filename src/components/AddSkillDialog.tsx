import { Github, Upload, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function AddSkillDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { t } = useTranslation();
	const [method, setMethod] = useState<"import" | "upload">("import");
	const [repoUrl, setRepoUrl] = useState("");
	const [skillName, setSkillName] = useState("");
	const [selectedFolder, setSelectedFolder] = useState<string>("");

	const fileInputRef = useRef<HTMLInputElement>(null);

	if (!isOpen) return null;

	const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			// Get the root folder name from the first file's webkitRelativePath
			const path = e.target.files[0].webkitRelativePath;
			if (path) {
				setSelectedFolder(path.split("/")[0]);
			} else {
				setSelectedFolder("Folder selected");
			}
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-theme-surface-hover border border-theme-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-theme-text">
				<div className="px-6 py-4 border-b border-theme-border flex justify-between items-center">
					<h2 className="text-sm font-bold uppercase tracking-widest text-theme-accent">{t("manage.addSkill")}</h2>
					<button
						onClick={onClose}
						className="text-theme-text-secondary hover:text-theme-text transition-colors rounded p-1 hover:bg-theme-surface-active"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div className="flex gap-2">
						<button
							onClick={() => setMethod("import")}
							className={`flex-1 py-3 px-4 rounded border flex flex-col items-center gap-2 transition-colors ${
								method === "import"
									? "bg-theme-accent/10 border-theme-accent text-theme-accent"
									: "bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-accent/50"
							}`}
						>
							<Github className="w-6 h-6" />
							<span className="text-[11px] uppercase tracking-widest font-medium">
								{t("manage.importFromGithub")}
							</span>
						</button>
						<button
							onClick={() => setMethod("upload")}
							className={`flex-1 py-3 px-4 rounded border flex flex-col items-center gap-2 transition-colors ${
								method === "upload"
									? "bg-theme-accent/10 border-theme-accent text-theme-accent"
									: "bg-theme-surface border-theme-border text-theme-text-secondary hover:border-theme-accent/50"
							}`}
						>
							<Upload className="w-6 h-6" />
							<span className="text-[11px] uppercase tracking-widest font-medium">
								{t("manage.uploadFolder")}
							</span>
						</button>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-[10px] uppercase tracking-widest text-theme-text-secondary mb-2">
								{t("manage.skillName")}
							</label>
							<input
								type="text"
								value={skillName}
								onChange={(e) => setSkillName(e.target.value)}
								className="w-full bg-theme-surface border border-theme-border rounded py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition-colors"
								placeholder="My Awesome Skill"
							/>
						</div>

						{method === "import" ? (
							<div>
								<label className="block text-[10px] uppercase tracking-widest text-theme-text-secondary mb-2">
									{t("manage.repoUrl")}
								</label>
								<input
									type="text"
									value={repoUrl}
									onChange={(e) => setRepoUrl(e.target.value)}
									className="w-full bg-theme-surface border border-theme-border rounded py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition-colors"
									placeholder="owner/repo"
								/>
							</div>
						) : (
							<div>
								<label className="block text-[10px] uppercase tracking-widest text-theme-text-secondary mb-2">
									{t("manage.selectFolder")}
								</label>
								<div
									className="w-full bg-theme-surface border border-theme-border border-dashed hover:border-theme-accent transition-colors rounded py-6 flex flex-col items-center justify-center cursor-pointer group"
									onClick={() => fileInputRef.current?.click()}
								>
									<Upload className="w-8 h-8 text-theme-text-muted mb-2 group-hover:text-theme-accent transition-colors" />
									<span className="text-sm text-theme-text-secondary group-hover:text-theme-text transition-colors">
										{selectedFolder || t("manage.selectFolder")}
									</span>
									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										onChange={handleFolderSelect}
										{...({ webkitdirectory: "" } as any)}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="px-6 py-4 border-t border-theme-border flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 border border-theme-border text-theme-text-secondary hover:bg-theme-surface-active hover:text-theme-text rounded text-xs uppercase tracking-widest transition-colors font-medium"
					>
						{t("manage.cancel")}
					</button>
					<button
						onClick={onClose}
						className="px-6 py-2 bg-theme-accent text-black rounded text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium"
					>
						{t("manage.submit")}
					</button>
				</div>
			</div>
		</div>
	);
}
