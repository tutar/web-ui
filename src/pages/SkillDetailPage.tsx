import yaml from "js-yaml";
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronRight, Edit2, FileText, Folder } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../lib/utils";

interface FileNode {
	id: string;
	name: string;
	type: "file" | "folder";
	children?: FileNode[];
	content?: string;
}

const mockTree: FileNode[] = [
	{
		id: "root",
		name: "skill-name",
		type: "folder",
		children: [
			{
				id: "1",
				name: "scripts",
				type: "folder",
				children: [
					{
						id: "2",
						name: "main.py",
						type: "file",
						content: 'def main():\n    print("Hello world")\n\nif __name__ == "__main__":\n    main()',
					},
					{ id: "3", name: "utils.py", type: "file", content: "def add(a, b):\n    return a + b" },
					{ id: "4", name: "requirements.txt", type: "file", content: "requests==2.31.0\nnumpy==1.26.0" },
				],
			},
			{
				id: "6",
				name: "references",
				type: "folder",
				children: [],
			},
			{
				id: "7",
				name: "assets",
				type: "folder",
				children: [],
			},
			{
				id: "5",
				name: "SKILL.md",
				type: "file",
				content:
					"---\nname: My Skill\ndescription: This is a sample skill.\n---\n\n# My Skill\n\nThis is a sample skill.",
			},
		],
	},
];

function FileTreeView({
	nodes,
	level = 0,
	onSelectFile,
	selectedFileId,
}: {
	nodes: FileNode[];
	level?: number;
	onSelectFile: (node: FileNode) => void;
	selectedFileId: string | null;
}) {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true });

	const toggleExpand = (id: string) => {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<div className="flex flex-col">
			{nodes.map((node) => (
				<React.Fragment key={node.id}>
					<div
						className={cn(
							"flex items-center py-1.5 px-2 cursor-pointer hover:bg-theme-surface-hover transition-colors rounded",
							selectedFileId === node.id && "bg-theme-surface-hover text-theme-accent",
						)}
						style={{ paddingLeft: `${level * 16 + 8}px` }}
						onClick={() => {
							if (node.type === "folder") {
								toggleExpand(node.id);
							} else {
								onSelectFile(node);
							}
						}}
					>
						{node.type === "folder" ? (
							<span className="mr-1 text-theme-text-muted">
								{expanded[node.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
							</span>
						) : (
							<span className="mr-1 w-4" />
						)}

						{node.type === "folder" ? (
							<Folder className="w-4 h-4 mr-2 text-theme-accent" />
						) : (
							<FileText className="w-4 h-4 mr-2 text-theme-text-secondary" />
						)}

						<span className={cn("text-sm", selectedFileId === node.id ? "text-theme-accent" : "text-theme-text")}>
							{node.name}
						</span>
					</div>

					{node.type === "folder" && expanded[node.id] && node.children && (
						<FileTreeView
							nodes={node.children}
							level={level + 1}
							onSelectFile={onSelectFile}
							selectedFileId={selectedFileId}
						/>
					)}
				</React.Fragment>
			))}
		</div>
	);
}

export function SkillDetailPage() {
	const { skillId } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [fileContent, setFileContent] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	const [skillName, setSkillName] = useState(`Awesome Skill ${skillId}`);
	const [isEditingName, setIsEditingName] = useState(false);

	const handleSelectFile = (node: FileNode) => {
		setSelectedFile(node);
		setFileContent(node.content || "");
		setIsEditMode(false);
		setErrorMsg("");
	};

	const handleSave = () => {
		if (selectedFile?.name === "SKILL.md") {
			try {
				const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
				if (!match) {
					throw new Error('SKILL.md must start with a YAML frontmatter block enclosed in "---"');
				}
				const frontmatter = yaml.load(match[1]) as any;
				if (!frontmatter || typeof frontmatter !== "object") {
					throw new Error("Invalid YAML frontmatter format");
				}
				if (!frontmatter.name) {
					throw new Error('Frontmatter must contain a "name" field');
				}
				if (!frontmatter.description) {
					throw new Error('Frontmatter must contain a "description" field');
				}
			} catch (err: any) {
				setErrorMsg(err.message);
				return;
			}
		}

		// Update local node if it existed
		if (selectedFile) {
			selectedFile.content = fileContent;
		}
		setErrorMsg("");
		setIsEditMode(false);
	};

	return (
		<div className="flex flex-col h-full bg-theme-base">
			<div className="h-16 flex items-center justify-between px-6 gap-2 border-b border-theme-border bg-theme-surface flex-shrink-0">
				<div className="flex items-center gap-4">
					<button
						onClick={() => navigate("/skills")}
						className="flex items-center gap-2 hover:text-theme-text transition-colors py-1 pl-1 pr-2 -ml-1 rounded hover:bg-theme-surface-hover text-theme-text-secondary"
					>
						<ArrowLeft className="w-4 h-4" />
						<span className="text-[11px] uppercase tracking-widest font-medium">{t("manage.skillsTitle")}</span>
					</button>
					<div className="w-px h-4 bg-theme-surface-active" />

					<div className="flex items-center gap-2 group">
						{isEditingName ? (
							<input
								type="text"
								value={skillName}
								onChange={(e) => setSkillName(e.target.value)}
								onBlur={() => setIsEditingName(false)}
								onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
								className="bg-theme-surface-hover border border-theme-accent rounded px-2 py-1 text-sm font-bold uppercase tracking-widest text-theme-accent outline-none w-48"
							/>
						) : (
							<>
								<h1
									className="text-sm font-bold uppercase tracking-widest text-theme-accent cursor-pointer"
									onDoubleClick={() => setIsEditingName(true)}
								>
									{skillName}
								</h1>
								<button
									onClick={() => setIsEditingName(true)}
									className="opacity-0 group-hover:opacity-100 p-1 text-theme-text-secondary hover:text-theme-accent transition-all rounded hover:bg-theme-surface-hover"
								>
									<Edit2 className="w-3 h-3" />
								</button>
							</>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{errorMsg && (
						<div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-red-500 mr-2 bg-red-500/10 px-2 py-1 rounded">
							<AlertCircle className="w-3 h-3" />
							<span>{errorMsg}</span>
						</div>
					)}
					{selectedFile && (
						<button
							onClick={() => (isEditMode ? handleSave() : setIsEditMode(true))}
							className={cn(
								"flex items-center gap-2 px-3 py-1.5 rounded text-[10px] uppercase tracking-widest font-medium transition-colors border",
								isEditMode
									? "bg-theme-accent text-black border-theme-accent hover:opacity-90"
									: "bg-theme-surface-hover text-theme-text border-theme-border hover:border-theme-accent/50 hover:text-theme-accent",
							)}
						>
							{isEditMode ? (
								<>
									<Check className="w-3 h-3" />
									{t("manage.saveChanges")}
								</>
							) : (
								<>
									<Edit2 className="w-3 h-3" />
									{t("manage.editMode")}
								</>
							)}
						</button>
					)}
				</div>
			</div>

			<div className="flex-1 flex overflow-hidden">
				{/* Left pane: File tree */}
				<div className="w-64 border-r border-theme-border bg-theme-surface flex flex-col flex-shrink-0">
					<div className="p-4 border-b border-theme-border">
						<h2 className="text-[10px] uppercase tracking-widest font-bold text-theme-text-secondary">
							{t("manage.files")}
						</h2>
					</div>
					<div className="flex-1 overflow-auto p-2">
						<FileTreeView
							nodes={mockTree}
							onSelectFile={handleSelectFile}
							selectedFileId={selectedFile?.id || null}
						/>
					</div>
				</div>

				{/* Right pane: Content */}
				<div className="flex-1 flex flex-col bg-theme-base overflow-hidden">
					{selectedFile ? (
						<div className="flex-1 flex flex-col pt-4">
							<div className="px-6 mb-4 flex items-center gap-2">
								<FileText className="w-4 h-4 text-theme-accent" />
								<h3 className="text-sm font-medium text-theme-text">{selectedFile.name}</h3>
							</div>

							<div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
								{isEditMode ? (
									<textarea
										value={fileContent}
										onChange={(e) => setFileContent(e.target.value)}
										className="flex-1 w-full bg-theme-surface-hover border border-theme-border rounded p-4 text-theme-text font-mono text-sm focus:outline-none focus:border-theme-accent transition-colors resize-none shadow-inner"
										spellCheck={false}
									/>
								) : (
									<div className="flex-1 w-full bg-theme-surface border border-theme-border rounded p-4 overflow-auto shadow-inner">
										<pre className="text-theme-text font-mono text-sm leading-relaxed">{fileContent}</pre>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-theme-text-muted">
							<FileText className="w-16 h-16 mb-4 opacity-20" />
							<p className="text-sm uppercase tracking-widest">{t("manage.selectFolder")}...</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
